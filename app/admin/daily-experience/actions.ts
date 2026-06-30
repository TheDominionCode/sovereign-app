"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";

type Table = "daily_principles" | "daily_reflections" | "daily_questions" | "daily_intentions";

function getTable(formData: FormData): Table {
  const t = String(formData.get("_table") ?? "");
  if (!["daily_principles", "daily_reflections", "daily_questions", "daily_intentions"].includes(t)) {
    redirect("/admin/daily-experience?error=invalid_table");
  }
  return t as Table;
}

export async function createEntryAction(formData: FormData): Promise<void> {
  await requirePermission("daily_experience");
  const table = getTable(formData);
  const content_en = String(formData.get("content_en") ?? "").trim();
  const content_es = String(formData.get("content_es") ?? "").trim();
  if (!content_en || !content_es) redirect("/admin/daily-experience?error=missing_content");

  const admin = createAdminClient();
  const extra =
    table === "daily_intentions"
      ? { sort_order: Number(formData.get("sort_order") ?? 0) }
      : { display_date: (formData.get("display_date") as string | null) || null };

  await admin.from(table).insert({ content_en, content_es, active: true, ...extra });
  revalidatePath("/admin/daily-experience");
}

export async function updateEntryAction(formData: FormData): Promise<void> {
  await requirePermission("daily_experience");
  const table = getTable(formData);
  const id = Number(formData.get("id"));
  const content_en = String(formData.get("content_en") ?? "").trim();
  const content_es = String(formData.get("content_es") ?? "").trim();
  if (!id || !content_en || !content_es) redirect("/admin/daily-experience?error=missing_fields");

  const admin = createAdminClient();
  const extra =
    table === "daily_intentions"
      ? { sort_order: Number(formData.get("sort_order") ?? 0) }
      : { display_date: (formData.get("display_date") as string | null) || null };

  await admin.from(table).update({ content_en, content_es, ...extra }).eq("id", id);
  revalidatePath("/admin/daily-experience");
}

export async function deleteEntryAction(formData: FormData): Promise<void> {
  await requirePermission("daily_experience");
  const table = getTable(formData);
  const id = Number(formData.get("id"));
  if (!id) redirect("/admin/daily-experience?error=missing_id");

  const admin = createAdminClient();
  await admin.from(table).delete().eq("id", id);
  revalidatePath("/admin/daily-experience");
}

export async function toggleActiveAction(formData: FormData): Promise<void> {
  await requirePermission("daily_experience");
  const table = getTable(formData);
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return;

  const admin = createAdminClient();
  await admin.from(table).update({ active: !active }).eq("id", id);
  revalidatePath("/admin/daily-experience");
}
