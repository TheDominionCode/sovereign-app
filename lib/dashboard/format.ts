// Shared formatting + date helpers for the dashboard. Centralizes what was
// previously copy-pasted across planner/summary.

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function normalizeDay(input: string): string {
  return isValidISODate(input) ? input : todayISO();
}

export function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

// Monday of the ISO week containing `iso`.
export function startOfWeekMonday(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso || !isValidISODate(iso.slice(0, 10))) return "";
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtLongDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// supabase-js returns `numeric` columns as strings; coerce safely.
export function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

export function money(value: unknown, currency = "$"): string {
  const n = num(value);
  return `${currency}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// How many months of a recurring amount fall in one month.
export const FREQ_TO_MONTHLY: Record<string, number> = {
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  yearly: 1 / 12,
};
