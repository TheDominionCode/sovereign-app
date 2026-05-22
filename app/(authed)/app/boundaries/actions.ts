"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";

export async function addBoundaryList() {
  const user = await requireActiveSubscription();
  const supabase = await createClient();
  const { count } = await supabase
    .from("boundary_lists")
    .select("id", { count: "exact", head: true });
  await supabase.from("boundary_lists").insert({
    user_id: user.id,
    kind: "custom",
    title: "New boundary",
    subtitle: "What this line is about.",
    color: "#7a9a6e",
    position: count ?? 0,
  });
  revalidatePath("/app/boundaries");
}

export async function updateBoundaryList(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  if (!id || !title) return;
  const supabase = await createClient();
  await supabase.from("boundary_lists").update({ title, subtitle }).eq("id", id);
  revalidatePath("/app/boundaries");
}

export async function deleteBoundaryList(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("boundary_lists").delete().eq("id", id);
  revalidatePath("/app/boundaries");
}

export async function addBoundaryItem(formData: FormData) {
  await requireActiveSubscription();
  const listId = String(formData.get("listId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!listId || !text) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("boundary_items")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId);
  await supabase
    .from("boundary_items")
    .insert({ list_id: listId, text, position: count ?? 0 });
  revalidatePath("/app/boundaries");
}

export async function deleteBoundaryItem(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("boundary_items").delete().eq("id", id);
  revalidatePath("/app/boundaries");
}
