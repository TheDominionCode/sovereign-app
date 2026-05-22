"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";

export async function savePreferences(formData: FormData) {
  const user = await requireActiveSubscription();
  const supabase = await createClient();
  await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      accent: String(formData.get("accent") ?? "sage"),
      lang: String(formData.get("lang") ?? "en"),
      week_start: String(formData.get("week_start") ?? "Monday"),
      currency: String(formData.get("currency") ?? "$"),
      calendar_label: String(formData.get("calendar_label") ?? "Calendar").trim() || "Calendar",
      notify_daily: String(formData.get("notify_daily") ?? "") === "on",
      notify_milestones: String(formData.get("notify_milestones") ?? "") === "on",
      show_year_view: String(formData.get("show_year_view") ?? "") === "on",
      show_weekly_schedule: String(formData.get("show_weekly_schedule") ?? "") === "on",
    },
    { onConflict: "user_id" }
  );
  revalidatePath("/app/settings");
  revalidatePath("/app");
}

export async function setInspiration(formData: FormData) {
  const user = await requireActiveSubscription();
  const img = String(formData.get("inspiration_img") ?? "");
  if (!img) return;
  const supabase = await createClient();
  await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, inspiration_img: img }, { onConflict: "user_id" });
  revalidatePath("/app/settings");
  revalidatePath("/app");
}

export async function removeInspiration() {
  const user = await requireActiveSubscription();
  const supabase = await createClient();
  await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, inspiration_img: null }, { onConflict: "user_id" });
  revalidatePath("/app/settings");
  revalidatePath("/app");
}
