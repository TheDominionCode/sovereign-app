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
