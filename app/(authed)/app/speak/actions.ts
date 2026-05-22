"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";

export async function addPhrase(formData: FormData) {
  const user = await requireActiveSubscription();
  const from_text = String(formData.get("from") ?? "").trim();
  const to_text = String(formData.get("to") ?? "").trim();
  if (!from_text || !to_text) return;
  const category = String(formData.get("category") ?? "Saying No").trim() || "Saying No";
  const why = String(formData.get("why") ?? "").trim() || null;

  const supabase = await createClient();
  await supabase
    .from("elegant_phrases")
    .insert({ user_id: user.id, category, from_text, to_text, why });
  revalidatePath("/app/speak");
}

export async function deletePhrase(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("elegant_phrases").delete().eq("id", id);
  revalidatePath("/app/speak");
}
