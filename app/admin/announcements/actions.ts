"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "../guard";

// Create or update an announcement. If form has `id`, edit that row;
// otherwise insert a new one. The "send" action both saves the row AND
// marks any existing dismissals stale by deleting them — so when the
// owner edits an announcement, anyone who already dismissed it will
// see the new version next time they open the app.
export async function saveAnnouncementAction(formData: FormData): Promise<void> {
  const me = await requirePermission("announcements");

  const id = (formData.get("id") as string | null) || null;
  const title = ((formData.get("title") as string | null) ?? "").trim() || null;
  const body = ((formData.get("body") as string | null) ?? "").trim();
  const emoji = ((formData.get("emoji") as string | null) ?? "").trim() || null;

  if (!body) {
    redirect("/admin/announcements?error=" + encodeURIComponent("Message is required."));
  }

  const admin = createAdminClient();
  const userRow = await admin.auth.admin.listUsers({ perPage: 200 });
  const meRow = (userRow.data?.users ?? []).find((u) => u.email && u.email.toLowerCase() === me.email.toLowerCase());

  if (id) {
    // Edit existing — also wipe its dismissals so everyone sees the new version.
    await admin.from("announcements").update({
      title, body, emoji, active: true,
    }).eq("id", id);
    await admin.from("announcement_dismissals").delete().eq("announcement_id", id);
  } else {
    await admin.from("announcements").insert({
      title, body, emoji,
      audience: "all",
      active: true,
      created_by: meRow?.id ?? null,
    });
  }

  revalidatePath("/admin/announcements");
  redirect("/admin/announcements?sent=1");
}

// Deactivate hides the announcement from anyone who hasn't dismissed it
// yet. Keeps the row + analytics intact.
export async function deactivateAnnouncementAction(formData: FormData): Promise<void> {
  await requirePermission("announcements");
  const id = formData.get("id") as string;
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("announcements").update({ active: false }).eq("id", id);
  revalidatePath("/admin/announcements");
}

export async function reactivateAnnouncementAction(formData: FormData): Promise<void> {
  await requirePermission("announcements");
  const id = formData.get("id") as string;
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("announcements").update({ active: true }).eq("id", id);
  revalidatePath("/admin/announcements");
}
