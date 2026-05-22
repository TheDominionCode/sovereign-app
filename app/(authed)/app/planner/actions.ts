"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { normalizeDay, normalizePriority, DONE_COLS } from "./constants";

function refresh() {
  revalidatePath("/app/planner");
  revalidatePath("/app/habits");
  revalidatePath("/app");
}

// ── tasks ───────────────────────────────────────────────────────────────────
export async function createTask(formData: FormData) {
  const user = await requireActiveSubscription();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const day = normalizeDay(String(formData.get("day") ?? ""));
  const priority = normalizePriority(String(formData.get("priority") ?? ""));
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .insert({ user_id: user.id, title, day, priority, category: "personal" });
  refresh();
}

export async function toggleTask(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  const done = String(formData.get("done") ?? "") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("tasks").update({ done: !done }).eq("id", id);
  refresh();
}

export async function deleteTask(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  refresh();
}

// ── planner day (priorities, wins, gratitude, journal, tomorrow) ─────────────
export async function savePlannerDay(formData: FormData) {
  const user = await requireActiveSubscription();
  const day = normalizeDay(String(formData.get("day") ?? ""));
  const priorities = [0, 1, 2].map((i) => String(formData.get(`p${i}`) ?? "").trim());
  const wins = [0, 1, 2].map((i) => String(formData.get(`w${i}`) ?? "").trim());
  const supabase = await createClient();
  await supabase.from("planner_days").upsert(
    {
      user_id: user.id,
      day,
      priorities,
      wins,
      gratitude: String(formData.get("gratitude") ?? "").trim(),
      journal: String(formData.get("journal") ?? "").trim(),
      tomorrow: String(formData.get("tomorrow") ?? "").trim(),
    },
    { onConflict: "user_id,day" }
  );
  refresh();
}

export async function setWater(formData: FormData) {
  const user = await requireActiveSubscription();
  const day = normalizeDay(String(formData.get("day") ?? ""));
  const n = Math.max(0, Math.min(8, parseInt(String(formData.get("n") ?? "0"), 10) || 0));
  const supabase = await createClient();
  await supabase
    .from("planner_days")
    .upsert({ user_id: user.id, day, water_glasses: n }, { onConflict: "user_id,day" });
  refresh();
}

export async function toggleRoutine(formData: FormData) {
  const user = await requireActiveSubscription();
  const day = normalizeDay(String(formData.get("day") ?? ""));
  const col = String(formData.get("col") ?? "");
  if (!DONE_COLS.has(col as never)) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("planner_days")
    .select(col)
    .eq("day", day)
    .maybeSingle();
  const current = Boolean((data as Record<string, boolean> | null)?.[col]);
  await supabase
    .from("planner_days")
    .upsert({ user_id: user.id, day, [col]: !current }, { onConflict: "user_id,day" });
  refresh();
}

// ── custom habits ────────────────────────────────────────────────────────────
export async function addHabit(formData: FormData) {
  const user = await requireActiveSubscription();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("habits")
    .select("id", { count: "exact", head: true });
  await supabase.from("habits").insert({ user_id: user.id, name, position: count ?? 0 });
  refresh();
}

export async function deleteHabit(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("habits").delete().eq("id", id);
  refresh();
}

export async function toggleHabitCompletion(formData: FormData) {
  const user = await requireActiveSubscription();
  const habitId = String(formData.get("habitId") ?? "");
  const day = normalizeDay(String(formData.get("day") ?? ""));
  const done = String(formData.get("done") ?? "") === "true";
  if (!habitId) return;
  const supabase = await createClient();
  if (done) {
    await supabase
      .from("planner_habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("day", day);
  } else {
    await supabase
      .from("planner_habit_completions")
      .insert({ user_id: user.id, habit_id: habitId, day });
  }
  refresh();
}
