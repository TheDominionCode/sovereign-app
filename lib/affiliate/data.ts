import { createAdminClient } from "@/lib/supabase/admin";

// Admin-editable settings stored as key/value in community_settings. The two
// keys today are `quote` (heading subtitle) and `theme` (preset name from
// lib/affiliate/themes.ts). Defaults are seeded by the migration so a missing
// row is unusual but we still fall back gracefully.
export type CommunitySettings = {
  quote: string;
  theme: string;
};

export async function getCommunitySettings(): Promise<CommunitySettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("community_settings")
    .select("key,value")
    .in("key", ["quote", "theme"]);
  const map = new Map((data ?? []).map((r) => [r.key as string, r.value as string]));
  return {
    quote: map.get("quote") ?? "What's possible for her is already on its way to you.",
    theme: map.get("theme") ?? "sand",
  };
}

export type ApplicationRow = {
  id: number;
  user_id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  applied_at: string;
  decided_at: string | null;
  decided_by: string | null;
};

export type PostRow = {
  id: number;
  author_id: string;
  author_email: string;
  author_name: string | null;
  body: string;
  image_path: string | null;
  status: "pending" | "approved" | "rejected" | "hidden";
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  reaction_count: number;
};

export type FeedPost = PostRow & {
  image_url: string | null;
  reacted_by_me: boolean;
};

// Pull every affiliate application, newest first. Used by /admin/affiliates.
export async function getAllApplications(): Promise<ApplicationRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("affiliate_applications")
    .select("id,user_id,email,status,message,applied_at,decided_at,decided_by")
    .order("applied_at", { ascending: false });
  return (data ?? []) as ApplicationRow[];
}

// Pull every post regardless of status. Used by /admin/community moderation.
export async function getAllPosts(): Promise<PostRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("community_posts")
    .select(
      "id,author_id,author_email,author_name,body,image_path,status,created_at,approved_at,approved_by,reaction_count",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []) as PostRow[];
}

// Pull approved posts for the public-facing affiliate feed. Joins the
// signed-in user's reactions so the UI can render the heart filled/unfilled.
// Image paths get converted to public storage URLs here so the component
// stays dumb.
export async function getApprovedFeed(viewerId: string | null): Promise<FeedPost[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("community_posts")
    .select(
      "id,author_id,author_email,author_name,body,image_path,status,created_at,approved_at,approved_by,reaction_count",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);
  const posts = (data ?? []) as PostRow[];
  if (posts.length === 0) return [];

  // Bulk-load the viewer's reactions so we can show which ones they've already
  // touched. Skipped entirely for signed-out viewers (the feed page guard
  // would have already redirected them, but defensive belt + suspenders).
  let reactedSet = new Set<number>();
  if (viewerId) {
    const { data: reactions } = await admin
      .from("community_reactions")
      .select("post_id")
      .eq("user_id", viewerId)
      .in(
        "post_id",
        posts.map((p) => p.id),
      );
    reactedSet = new Set((reactions ?? []).map((r) => r.post_id as number));
  }

  return posts.map((p) => {
    let image_url: string | null = null;
    if (p.image_path) {
      const { data: pub } = admin.storage.from("community-images").getPublicUrl(p.image_path);
      image_url = pub?.publicUrl ?? null;
    }
    return {
      ...p,
      image_url,
      reacted_by_me: reactedSet.has(p.id),
    };
  });
}
