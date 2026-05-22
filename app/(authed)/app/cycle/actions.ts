"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { isValidISODate, todayISO } from "@/lib/dashboard/format";
import type { CycleEntryRow } from "@/lib/dashboard/types";

async function patchEntry(day: string, patch: Partial<CycleEntryRow>) {
  const user = await requireActiveSubscription();
  if (!isValidISODate(day)) return;
  const supabase = await createClient();
  await supabase
    .from("cycle_entries")
    .upsert({ user_id: user.id, day, ...patch }, { onConflict: "user_id,day" });
  revalidatePath("/app/cycle");
  revalidatePath("/app");
}

export async function setFlow(formData: FormData) {
  await patchEntry(String(formData.get("day") ?? ""), {
    flow: String(formData.get("flow") ?? "none") as CycleEntryRow["flow"],
  });
}

export async function setMood(formData: FormData) {
  await patchEntry(String(formData.get("day") ?? ""), {
    mood: String(formData.get("mood") ?? "") || null,
  });
}

export async function setNotes(formData: FormData) {
  await patchEntry(String(formData.get("day") ?? ""), {
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
}

export async function toggleSymptom(formData: FormData) {
  const user = await requireActiveSubscription();
  const day = String(formData.get("day") ?? "");
  const symptom = String(formData.get("symptom") ?? "");
  if (!isValidISODate(day) || !symptom) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("cycle_entries")
    .select("symptoms")
    .eq("day", day)
    .maybeSingle();
  const current: string[] = (data?.symptoms as string[] | undefined) ?? [];
  const next = current.includes(symptom)
    ? current.filter((s) => s !== symptom)
    : [...current, symptom];
  await supabase
    .from("cycle_entries")
    .upsert({ user_id: user.id, day, symptoms: next }, { onConflict: "user_id,day" });
  revalidatePath("/app/cycle");
}

export async function addVitamin(formData: FormData) {
  const user = await requireActiveSubscription();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("vitamins")
    .select("id", { count: "exact", head: true });
  await supabase.from("vitamins").insert({
    user_id: user.id,
    name,
    dose: String(formData.get("dose") ?? "").trim() || null,
    time_label: String(formData.get("time") ?? "").trim() || null,
    position: count ?? 0,
  });
  revalidatePath("/app/cycle");
  revalidatePath("/app");
}

export async function deleteVitamin(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("vitamins").delete().eq("id", id);
  revalidatePath("/app/cycle");
  revalidatePath("/app");
}

export async function toggleDose(formData: FormData) {
  await requireActiveSubscription();
  const vitaminId = String(formData.get("vitaminId") ?? "");
  const taken = String(formData.get("taken") ?? "") === "true";
  if (!vitaminId) return;
  const supabase = await createClient();
  const day = todayISO();
  if (taken) {
    await supabase
      .from("vitamin_doses")
      .delete()
      .eq("vitamin_id", vitaminId)
      .eq("taken_on", day);
  } else {
    await supabase
      .from("vitamin_doses")
      .insert({ vitamin_id: vitaminId, taken_on: day });
  }
  revalidatePath("/app/cycle");
  revalidatePath("/app");
}
