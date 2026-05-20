"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { normalizeDay, normalizePriority } from "./constants";

export async function createTask(formData: FormData) {
  const user = await requireActiveSubscription();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const day = normalizeDay(String(formData.get("day") ?? ""));
  const priority = normalizePriority(String(formData.get("priority") ?? ""));
  const category =
    String(formData.get("category") ?? "personal").trim() || "personal";

  const supabase = await createClient();
  await supabase
    .from("tasks")
    .insert({ user_id: user.id, title, day, priority, category });

  revalidatePath("/app/planner");
  revalidatePath("/app");
}

export async function toggleTask(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const currentlyDone = String(formData.get("done") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("tasks").update({ done: !currentlyDone }).eq("id", id);

  revalidatePath("/app/planner");
  revalidatePath("/app");
}

export async function deleteTask(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);

  revalidatePath("/app/planner");
  revalidatePath("/app");
}
