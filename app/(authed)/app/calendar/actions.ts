"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { isValidISODate } from "@/lib/dashboard/format";

export async function addEvent(formData: FormData) {
  const user = await requireActiveSubscription();
  const day = String(formData.get("day") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!isValidISODate(day) || !title) return;
  const supabase = await createClient();
  await supabase.from("calendar_events").insert({
    user_id: user.id,
    day,
    title,
    time_label: String(formData.get("time") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/app/calendar");
}

export async function deleteEvent(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("calendar_events").delete().eq("id", id);
  revalidatePath("/app/calendar");
}
