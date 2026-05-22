"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { todayISO } from "@/lib/dashboard/format";

export async function addCard(formData: FormData) {
  const user = await requireActiveSubscription();
  const caption = String(formData.get("caption") ?? "").trim();
  const img = String(formData.get("img") ?? "");
  if (!caption && !img) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("vision_cards")
    .select("id", { count: "exact", head: true });
  await supabase.from("vision_cards").insert({
    user_id: user.id,
    caption: caption || null,
    img_url: img || null,
    why: String(formData.get("why") ?? "").trim() || null,
    letter: String(formData.get("letter") ?? "").trim() || null,
    target_date: String(formData.get("target_date") ?? "").trim() || null,
    position: count ?? 0,
  });
  revalidatePath("/app/vision");
}

export async function toggleAchieved(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const achieved = String(formData.get("achieved") ?? "") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("vision_cards")
    .update({ achieved: !achieved, achieved_at: !achieved ? todayISO() : null })
    .eq("id", id);
  revalidatePath("/app/vision");
}

export async function deleteCard(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("vision_cards").delete().eq("id", id);
  revalidatePath("/app/vision");
}

export async function saveMeta(formData: FormData) {
  const user = await requireActiveSubscription();
  const supabase = await createClient();
  await supabase.from("vision_meta").upsert(
    {
      user_id: user.id,
      year: parseInt(String(formData.get("year") ?? ""), 10) || new Date().getFullYear(),
      statement: String(formData.get("statement") ?? "").trim(),
      top_verse: String(formData.get("top_verse") ?? "").trim(),
    },
    { onConflict: "user_id" }
  );
  revalidatePath("/app/vision");
}
