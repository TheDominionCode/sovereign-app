"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { normalizeGoalCategory } from "./constants";

export async function createGoal(formData: FormData) {
  const user = await requireActiveSubscription();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const category = normalizeGoalCategory(String(formData.get("category") ?? ""));
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  const deadline = deadlineRaw || null;
  const why = String(formData.get("why") ?? "").trim() || null;

  const supabase = await createClient();
  await supabase
    .from("goals")
    .insert({ user_id: user.id, title, category, deadline, why });

  revalidatePath("/app/goals");
  revalidatePath("/app");
}

export async function updateGoalProgress(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const progress = Math.max(
    0,
    Math.min(100, parseInt(String(formData.get("progress") ?? "0"), 10) || 0)
  );
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("goals").update({ progress }).eq("id", id);

  revalidatePath("/app/goals");
  revalidatePath("/app");
}

export async function toggleGoalDone(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const currentlyDone = String(formData.get("done") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("goals")
    .update({ progress: currentlyDone ? 0 : 100 })
    .eq("id", id);

  revalidatePath("/app/goals");
  revalidatePath("/app");
}

export async function deleteGoal(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("goals").delete().eq("id", id);

  revalidatePath("/app/goals");
  revalidatePath("/app");
}

export async function addMilestone(formData: FormData) {
  await requireActiveSubscription();
  const goalId = String(formData.get("goalId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!goalId || !text) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("goal_milestones")
    .select("id", { count: "exact", head: true })
    .eq("goal_id", goalId);

  await supabase
    .from("goal_milestones")
    .insert({ goal_id: goalId, text, position: count ?? 0 });

  revalidatePath("/app/goals");
}

export async function toggleMilestone(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const currentlyDone = String(formData.get("done") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("goal_milestones")
    .update({ done: !currentlyDone })
    .eq("id", id);

  revalidatePath("/app/goals");
}

export async function deleteMilestone(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("goal_milestones").delete().eq("id", id);

  revalidatePath("/app/goals");
}
