"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";

type Table = "daily_principles" | "daily_reflections" | "daily_questions" | "daily_intentions";

export async function createEntryAction(
  table: Table,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  await requirePermission("daily_experience");
  const content_en = String(formData.get("content_en") ?? "").trim();
  const content_es = String(formData.get("content_es") ?? "").trim();
  if (!content_en || !content_es) return { error: "Both English and Spanish content are required." };

  const admin = createAdminClient();
  const extra =
    table === "daily_intentions"
      ? { sort_order: Number(formData.get("sort_order") ?? 0) }
      : { display_date: formData.get("display_date") || null };

  const { error } = await admin.from(table).insert({ content_en, content_es, active: true, ...extra });
  if (error) return { error: error.message };

  revalidatePath("/admin/daily-experience");
  return { success: "Entry created." };
}

export async function updateEntryAction(
  table: Table,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  await requirePermission("daily_experience");
  const id = Number(formData.get("id"));
  const content_en = String(formData.get("content_en") ?? "").trim();
  const content_es = String(formData.get("content_es") ?? "").trim();
  if (!id) return { error: "Missing ID." };
  if (!content_en || !content_es) return { error: "Both English and Spanish content are required." };

  const admin = createAdminClient();
  const extra =
    table === "daily_intentions"
      ? { sort_order: Number(formData.get("sort_order") ?? 0) }
      : { display_date: formData.get("display_date") || null };

  const { error } = await admin.from(table).update({ content_en, content_es, ...extra }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/daily-experience");
  return { success: "Entry updated." };
}

export async function deleteEntryAction(
  table: Table,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  await requirePermission("daily_experience");
  const id = Number(formData.get("id"));
  if (!id) return { error: "Missing ID." };

  const admin = createAdminClient();
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/daily-experience");
  return { success: "Entry deleted." };
}

export async function toggleActiveAction(
  table: Table,
  formData: FormData
): Promise<{ error?: string }> {
  await requirePermission("daily_experience");
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return { error: "Missing ID." };

  const admin = createAdminClient();
  await admin.from(table).update({ active: !active }).eq("id", id);

  revalidatePath("/admin/daily-experience");
  return {};
}
