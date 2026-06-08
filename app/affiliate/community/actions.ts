"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApprovedAffiliate } from "@/lib/affiliate/guard";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB cap — enough for a phone-camera screenshot
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Submit a new post to the wall of wins. Always lands in `pending` status so
// the admin can review before anyone else sees it. Optional image is uploaded
// to the community-images storage bucket under a UUID name.
export async function submitPostAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const affiliate = await requireApprovedAffiliate();

  const body = (formData.get("body") ?? "").toString().trim().slice(0, 4000);
  if (!body) return { ok: false, error: "Write something before posting." };

  const admin = createAdminClient();

  // Optional image upload. The form field is named "image"; if it's missing or
  // empty (browser sends an empty File with size 0 when nothing was picked)
  // we just skip the upload path.
  let imagePath: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Image must be 5MB or less." };
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return { ok: false, error: "Image must be JPEG, PNG, WebP, or GIF." };
    }
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 6);
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
    const objectName = `${randomUUID()}.${safeExt}`;
    const { error: upErr } = await admin.storage
      .from("community-images")
      .upload(objectName, file, {
        contentType: file.type,
        cacheControl: "31536000",
      });
    if (upErr) {
      return { ok: false, error: "Image upload failed. Try again." };
    }
    imagePath = objectName;
  }

  // Pull the author's display name from profiles so the feed can render
  // "Amanda Brooks" instead of "amanda…@gmail.com". Fall back to the email
  // username when no profile name is set (it still beats the masked email).
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", affiliate.userId)
    .maybeSingle();
  const fallbackName = (() => {
    const local = affiliate.email.split("@")[0] ?? "";
    return local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  })();
  const authorName =
    (profile?.full_name && profile.full_name.trim()) || fallbackName || affiliate.email;

  // Admins (owner/staff) skip the moderation queue — their posts go straight
  // into the public feed. Approval audit fields are still stamped so the row
  // looks the same shape as a normally-approved post.
  const isAdmin = affiliate.isAdmin === true;
  const now = new Date().toISOString();
  await admin.from("community_posts").insert({
    author_id: affiliate.userId,
    author_email: affiliate.email,
    author_name: authorName,
    body,
    image_path: imagePath,
    status: isAdmin ? "approved" : "pending",
    approved_at: isAdmin ? now : null,
    approved_by: isAdmin ? affiliate.email : null,
  });

  revalidatePath("/affiliate/community");
  revalidatePath("/admin/community");
  return { ok: true };
}

// Toggle the signed-in affiliate's reaction on a post. Insert if not reacted,
// delete if already reacted. The denormalized reaction_count column is kept
// in sync with two extra UPDATEs so the feed can render counts without a
// join. Cheap and good enough at this scale.
export async function toggleReactionAction(postId: number): Promise<{ ok: boolean; reacted: boolean }> {
  const affiliate = await requireApprovedAffiliate();
  const supabase = await createClient();
  const admin = createAdminClient();

  // Only allow reactions on approved posts (no pre-approval social pressure).
  const { data: post } = await admin
    .from("community_posts")
    .select("id,status,reaction_count")
    .eq("id", postId)
    .maybeSingle();
  if (!post || post.status !== "approved") return { ok: false, reacted: false };

  const { data: existing } = await admin
    .from("community_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", affiliate.userId)
    .maybeSingle();

  if (existing) {
    await admin
      .from("community_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", affiliate.userId);
    await admin
      .from("community_posts")
      .update({ reaction_count: Math.max(0, (post.reaction_count ?? 0) - 1) })
      .eq("id", postId);
    revalidatePath("/affiliate/community");
    return { ok: true, reacted: false };
  }

  await admin.from("community_reactions").insert({ post_id: postId, user_id: affiliate.userId });
  await admin
    .from("community_posts")
    .update({ reaction_count: (post.reaction_count ?? 0) + 1 })
    .eq("id", postId);

  // The supabase server client read above was unused beyond auth; we keep the
  // import so the function is obviously running in an authed context.
  void supabase;
  revalidatePath("/affiliate/community");
  return { ok: true, reacted: true };
}

// Edit the body of a post the caller authored. Image stays as-is to keep the
// scope tight; deleting the post is the way to swap photos. Re-reads the post
// to confirm the caller is the author — never trust the client-passed id.
// The post stays approved if it was approved, which means edits are visible
// immediately. (We can add a "back to pending on edit" rule later if needed.)
export async function editOwnPostAction(
  postId: number,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const affiliate = await requireApprovedAffiliate();
  const trimmed = (body ?? "").trim().slice(0, 4000);
  if (!trimmed) return { ok: false, error: "Post can't be empty." };

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("community_posts")
    .select("id,author_id,status")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, error: "Post not found." };
  if (post.author_id !== affiliate.userId) {
    return { ok: false, error: "You can only edit your own posts." };
  }

  await admin.from("community_posts").update({ body: trimmed }).eq("id", postId);
  revalidatePath("/affiliate/community");
  revalidatePath("/admin/community");
  return { ok: true };
}

// Delete a post the caller authored (plus its image from storage).
export async function deleteOwnPostAction(
  postId: number,
): Promise<{ ok: boolean; error?: string }> {
  const affiliate = await requireApprovedAffiliate();
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("community_posts")
    .select("id,author_id,image_path")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, error: "Post not found." };
  if (post.author_id !== affiliate.userId) {
    return { ok: false, error: "You can only delete your own posts." };
  }

  await admin.from("community_posts").delete().eq("id", postId);
  if (post.image_path) {
    await admin.storage.from("community-images").remove([post.image_path]);
  }

  revalidatePath("/affiliate/community");
  revalidatePath("/admin/community");
  return { ok: true };
}
