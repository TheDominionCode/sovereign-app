"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { todayISO } from "@/lib/dashboard/format";

export async function addAffirmation(formData: FormData) {
  const user = await requireActiveSubscription();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  const category = String(formData.get("category") ?? "Confidence").trim() || "Confidence";
  const supabase = await createClient();
  await supabase
    .from("affirmations")
    .insert({ user_id: user.id, text, category, favorite: false, custom: true });
  revalidatePath("/app/affirmations");
  revalidatePath("/app");
}

export async function toggleFavorite(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const favorite = String(formData.get("favorite") ?? "") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("affirmations").update({ favorite: !favorite }).eq("id", id);
  revalidatePath("/app/affirmations");
}

export async function deleteAffirmation(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("affirmations").delete().eq("id", id);
  revalidatePath("/app/affirmations");
  revalidatePath("/app");
}

export async function setTodaysPick(formData: FormData) {
  const user = await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("affirmation_picks")
    .upsert(
      { user_id: user.id, day: todayISO(), affirmation_id: id },
      { onConflict: "user_id,day" }
    );
  revalidatePath("/app/affirmations");
  revalidatePath("/app");
}

export async function clearTodaysPick() {
  const user = await requireActiveSubscription();
  const supabase = await createClient();
  await supabase
    .from("affirmation_picks")
    .delete()
    .eq("user_id", user.id)
    .eq("day", todayISO());
  revalidatePath("/app/affirmations");
  revalidatePath("/app");
}
