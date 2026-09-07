// Shared types + constants for the Daily Reset Manager admin section.
// See supabase/migrations/20260827000000_daily_resets.sql for the schema
// this mirrors.

export type DailyResetStatus = "draft" | "pending_approval" | "approved" | "published" | "archived";

export type SectionKey =
  | "sovereign_reset"
  | "today_principle"
  | "scripture_reflection"
  | "brain_science"
  | "today_challenge"
  | "sovereign_thought";

export const SECTIONS: { key: SectionKey; label: string; emoji: string }[] = [
  { key: "sovereign_reset",      label: "The Sovereign Reset",       emoji: "🌿" },
  { key: "today_principle",      label: "Today's Principle",         emoji: "🧠" },
  { key: "scripture_reflection", label: "Scripture + Reflection",    emoji: "📖" },
  { key: "brain_science",        label: "Brain Science",             emoji: "🧠" },
  { key: "today_challenge",      label: "Today's Challenge",         emoji: "🎯" },
  { key: "sovereign_thought",    label: "Today's Sovereign Thought", emoji: "🌿" },
];

// Every content column on daily_resets, e.g. "sovereign_reset_en".
export const CONTENT_COLUMNS: string[] = SECTIONS.flatMap((s) => [`${s.key}_en`, `${s.key}_es`]);

export type DailyResetRow = {
  id: number;
  day_number: number;
  date: string;
  theme: string | null;
  nataly_direction: string | null;

  sovereign_reset_en: string | null;
  sovereign_reset_es: string | null;
  today_principle_en: string | null;
  today_principle_es: string | null;
  scripture_reflection_en: string | null;
  scripture_reflection_es: string | null;
  brain_science_en: string | null;
  brain_science_es: string | null;
  today_challenge_en: string | null;
  today_challenge_es: string | null;
  sovereign_thought_en: string | null;
  sovereign_thought_es: string | null;

  status: DailyResetStatus;
  ai_generated: boolean;
  admin_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;

  publish_at: string | null;
  published_at: string | null;

  version_number: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABELS: Record<DailyResetStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export const STATUS_STYLES: Record<DailyResetStatus, string> = {
  draft:             "bg-stone-100 text-stone-600 border border-stone-200",
  pending_approval:  "bg-amber-50 text-amber-700 border border-amber-200",
  approved:          "bg-sky-50 text-sky-700 border border-sky-200",
  published:         "bg-[#f4f7ee] text-[#5b7351] border border-[#d3e0c5]",
  archived:          "bg-stone-100 text-stone-400 border border-stone-200",
};

export const SECTION_COLUMN: Record<string, SectionKey> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s.key])
) as Record<string, SectionKey>;

export function isValidSection(key: string): key is SectionKey {
  return SECTIONS.some((s) => s.key === key);
}
