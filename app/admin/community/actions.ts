"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Decision = "approved" | "rejected" | "hidden";

// Move a community post to a new status. Used for approve/reject/hide.
// Audit fields (approved_at, approved_by) are stamped on every transition so
// the moderation table can show who did what.
export async function moderatePostAction(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  const decision = (formData.get("decision") ?? "").toString() as Decision;
  if (!id || !["approved", "rejected", "hidden"].includes(decision)) return;

  const admin = createAdminClient();
  await admin
    .from("community_posts")
    .update({
      status: decision,
      approved_at: new Date().toISOString(),
      approved_by: me.email,
    })
    .eq("id", id);

  revalidatePath("/admin/community");
  revalidatePath("/affiliate/community");
}

// Permanently delete a post + its image from storage. Useful for spam.
export async function deletePostAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;

  const admin = createAdminClient();
  // Look up the image path before deleting the row so we can clean up storage.
  const { data: post } = await admin
    .from("community_posts")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  await admin.from("community_posts").delete().eq("id", id);
  if (post?.image_path) {
    await admin.storage.from("community-images").remove([post.image_path]);
  }

  revalidatePath("/admin/community");
  revalidatePath("/affiliate/community");
}

// Edit a community post's body and display name. Used for seed posts and admin corrections.
export async function editPostAction(formData: FormData): Promise<{ error?: string; success?: string }> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const body = String(formData.get("body") ?? "").trim();
  const author_name = String(formData.get("author_name") ?? "").trim() || null;
  if (!id) return { error: "Missing post ID." };
  if (!body) return { error: "Message cannot be empty." };

  const admin = createAdminClient();
  await admin.from("community_posts").update({ body, author_name }).eq("id", id);

  revalidatePath("/admin/community");
  revalidatePath("/affiliate/community");
  return { success: "Post updated." };
}

// Insert a set of realistic seed posts so the community feed isn't empty
// when the first real member joins. Only runs when there are zero approved posts.
export async function seedPostsAction(): Promise<{ error?: string; success?: string }> {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();
  const { count } = await admin
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  if ((count ?? 0) > 0)
    return { error: `Already ${count} approved post(s) — delete them first if you want to re-seed.` };

  const seeds = [
    {
      author_name: "Amanda R.",
      body: "Just hit $2,800 in a single weekend using the content batching workflow. I've been stuck at $400/mo for MONTHS and I finally broke through. The system is legit — trust the process!!",
      created_at: "2026-05-06T14:22:00Z",
    },
    {
      author_name: "Brianna M.",
      body: "3 months in and I officially put in my two weeks at my 9-5. Terrifying and amazing all at once. Thank you for building something that actually prepares you for the hard parts and not just the highlight reel.",
      created_at: "2026-05-15T09:45:00Z",
    },
    {
      author_name: "Taylor S.",
      body: "Went from 400 followers to 12k in under 2 months. But the win I'm most proud of is my first ever $500 in digital product sales. I literally cried at my desk lol. Posting this so new members know it's real — it happens!!",
      created_at: "2026-05-24T19:10:00Z",
    },
    {
      author_name: "Keisha D.",
      body: "Set up my entire digital shop using the templates + the launch checklist. Took me one Saturday afternoon instead of the weeks I spent Googling everything before. Why did I wait so long to join this?",
      created_at: "2026-06-02T11:30:00Z",
    },
    {
      author_name: "Jessica T.",
      body: "Got laid off in March. Replaced 60% of my income by May with digital products. Sovereign gave me an actual roadmap when I had zero clue where to start. I don't even know what I would have done without this community.",
      created_at: "2026-06-11T16:55:00Z",
    },
    {
      author_name: "Priya K.",
      body: "First $1k month!! I know for some of y'all that's small but it's EVERYTHING to me. It's proof that I can actually do this on my own terms. 🤍",
      created_at: "2026-06-19T08:20:00Z",
    },
  ];

  const approvedAt = new Date().toISOString();
  await admin.from("community_posts").insert(
    seeds.map((s) => ({
      author_id: user.id,
      author_email: me.email,
      image_path: null,
      status: "approved" as const,
      approved_at: approvedAt,
      approved_by: me.email,
      reaction_count: 0,
      ...s,
    }))
  );

  revalidatePath("/admin/community");
  revalidatePath("/affiliate/community");
  return { success: `Seeded ${seeds.length} starter posts.` };
}

// Manually grant community access to a user by email, bypassing the apply
// flow. Creates or updates their affiliate_applications row to approved.
export async function addToCommunityAction(formData: FormData): Promise<{ error?: string; success?: string }> {
  const me = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (!profile) return { error: `No account found for ${email}. They need to sign up first.` };

  await admin
    .from("affiliate_applications")
    .upsert(
      {
        user_id: profile.id,
        email: profile.email,
        message: `Added directly by admin (${me.email})`,
        status: "approved",
        applied_at: new Date().toISOString(),
        decided_at: new Date().toISOString(),
        decided_by: me.email,
      },
      { onConflict: "user_id" }
    );

  revalidatePath("/admin/community");
  return { success: `${email} now has community access.` };
}
