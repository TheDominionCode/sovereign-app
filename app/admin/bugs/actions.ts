"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "../guard";

export async function updateBugStatusAction(formData: FormData): Promise<void> {
  await requirePermission("bugs");
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (!id || !status) return;
  const admin = createAdminClient();
  await admin.from("bug_reports").update({ status }).eq("id", id);
  revalidatePath("/admin/bugs");
}

export async function updateBugNotesAction(formData: FormData): Promise<void> {
  await requirePermission("bugs");
  const id = formData.get("id") as string;
  const admin_notes = (formData.get("admin_notes") as string | null) ?? "";
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("bug_reports").update({ admin_notes }).eq("id", id);
  revalidatePath("/admin/bugs");
}

export async function deleteBugAction(formData: FormData): Promise<void> {
  await requirePermission("bugs");
  const id = formData.get("id") as string;
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("bug_reports").delete().eq("id", id);
  revalidatePath("/admin/bugs");
}
