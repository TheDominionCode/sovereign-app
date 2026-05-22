"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";

export async function addCredential(formData: FormData) {
  const user = await requireActiveSubscription();
  const site = String(formData.get("site") ?? "").trim();
  if (!site) return;
  const supabase = await createClient();
  await supabase.from("credentials").insert({
    user_id: user.id,
    site,
    url: String(formData.get("url") ?? "").trim() || null,
    username: String(formData.get("username") ?? "").trim() || null,
    password: String(formData.get("password") ?? "") || null,
    category: String(formData.get("category") ?? "Personal").trim() || "Personal",
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/app/credentials");
}

export async function updateCredential(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const site = String(formData.get("site") ?? "").trim();
  if (!id || !site) return;
  const supabase = await createClient();
  await supabase
    .from("credentials")
    .update({
      site,
      url: String(formData.get("url") ?? "").trim() || null,
      username: String(formData.get("username") ?? "").trim() || null,
      password: String(formData.get("password") ?? "") || null,
      category: String(formData.get("category") ?? "Personal").trim() || "Personal",
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);
  revalidatePath("/app/credentials");
}

export async function deleteCredential(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("credentials").delete().eq("id", id);
  revalidatePath("/app/credentials");
}
