"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { todayISO } from "@/lib/dashboard/format";

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createNote(formData: FormData) {
  const user = await requireActiveSubscription();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const body = String(formData.get("body") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const pinned = String(formData.get("pinned") ?? "") === "on";

  const supabase = await createClient();
  await supabase.from("notes").insert({
    user_id: user.id,
    title,
    body,
    tags,
    pinned,
    note_date: todayISO(),
  });
  revalidatePath("/app/notes");
}

export async function updateNote(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;
  const body = String(formData.get("body") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const supabase = await createClient();
  await supabase.from("notes").update({ title, body, tags }).eq("id", id);
  revalidatePath("/app/notes");
}

export async function togglePin(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const pinned = String(formData.get("pinned") ?? "") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("notes").update({ pinned: !pinned }).eq("id", id);
  revalidatePath("/app/notes");
}

export async function deleteNote(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("notes").delete().eq("id", id);
  revalidatePath("/app/notes");
}
