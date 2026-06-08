"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";

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
