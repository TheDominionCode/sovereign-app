"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";

export async function addReflectionList() {
  const user = await requireActiveSubscription();
  const supabase = await createClient();
  const { count } = await supabase
    .from("reflection_lists")
    .select("id", { count: "exact", head: true });
  await supabase.from("reflection_lists").insert({
    user_id: user.id,
    kind: "custom",
    title: "New section",
    hint: "What's on your heart in this area?",
    position: count ?? 0,
  });
  revalidatePath("/app/growth");
}

export async function updateReflectionList(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const hint = String(formData.get("hint") ?? "").trim();
  if (!id || !title) return;
  const supabase = await createClient();
  await supabase.from("reflection_lists").update({ title, hint }).eq("id", id);
  revalidatePath("/app/growth");
}

export async function deleteReflectionList(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("reflection_lists").delete().eq("id", id);
  revalidatePath("/app/growth");
}

export async function addReflectionItem(formData: FormData) {
  await requireActiveSubscription();
  const listId = String(formData.get("listId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!listId || !text) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("reflection_items")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId);
  await supabase
    .from("reflection_items")
    .insert({ list_id: listId, text, position: count ?? 0 });
  revalidatePath("/app/growth");
}

export async function deleteReflectionItem(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("reflection_items").delete().eq("id", id);
  revalidatePath("/app/growth");
}
