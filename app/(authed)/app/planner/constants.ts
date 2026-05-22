import type { TaskPriority } from "@/lib/dashboard/types";

export const PRIORITIES: readonly TaskPriority[] = [
  "critical",
  "high",
  "normal",
] as const;

export function normalizePriority(input: string): TaskPriority {
  return (PRIORITIES as readonly string[]).includes(input)
    ? (input as TaskPriority)
    : "normal";
}

export function normalizeDay(input: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return new Date().toISOString().slice(0, 10);
}

// Built-in routines: planner_days done-flag column + routine_settings label/hidden field.
export const ROUTINES: {
  key: string;
  doneCol: "morning_done" | "afternoon_done" | "evening_done" | "workout_done" | "reading_done";
  labelField: "morning_label" | "afternoon_label" | "evening_label" | "workout_label" | "reading_label";
  hiddenField: "morning_hidden" | "afternoon_hidden" | "evening_hidden" | "workout_hidden" | "reading_hidden";
}[] = [
  { key: "morning", doneCol: "morning_done", labelField: "morning_label", hiddenField: "morning_hidden" },
  { key: "afternoon", doneCol: "afternoon_done", labelField: "afternoon_label", hiddenField: "afternoon_hidden" },
  { key: "evening", doneCol: "evening_done", labelField: "evening_label", hiddenField: "evening_hidden" },
  { key: "workout", doneCol: "workout_done", labelField: "workout_label", hiddenField: "workout_hidden" },
  { key: "reading", doneCol: "reading_done", labelField: "reading_label", hiddenField: "reading_hidden" },
];

export const DONE_COLS = new Set(ROUTINES.map((r) => r.doneCol));
