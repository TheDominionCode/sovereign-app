// Shared types + constants for the Daily Reset Manager admin section.
// See supabase/migrations/20260827000000_daily_resets.sql and
// supabase/migrations/20261004000000_daily_sovereign_content.sql for the
// schema this mirrors.

export type DailyResetStatus = "draft" | "pending_approval" | "approved" | "published" | "archived";

export type SectionKey =
  | "sovereign_reset"
  | "title"
  | "word_of_day"
  | "today_principle"
  | "scripture"
  | "scripture_reflection"
  | "brain_science"
  | "metacognition_prompt"
  | "today_challenge"
  | "sovereign_thought"
  | "alignment_prompt";

// Every individually editable + regenerable unit. Deliberately NOT a uniform
// {key}_en/{key}_es convention — some units (Word of the Day, Scripture) are
// compounds of several columns, and scripture_reference/translation aren't
// bilingual at all. `fields` lists every underlying column explicitly so the
// edit UI, the update action, and the AI functions all work off the same
// declarative list instead of three different hardcoded assumptions.
export type SectionField = { column: string; label: string; kind: "richtext" | "plain" };

export const SECTIONS: { key: SectionKey; label: string; emoji: string; fields: SectionField[] }[] = [
  { key: "sovereign_reset", label: "The Sovereign Reset", emoji: "🌿", fields: [
    { column: "sovereign_reset_en", label: "EN", kind: "richtext" },
    { column: "sovereign_reset_es", label: "ES", kind: "richtext" },
  ]},
  { key: "title", label: "Day Title", emoji: "🏷", fields: [
    { column: "title_en", label: "EN", kind: "plain" },
    { column: "title_es", label: "ES", kind: "plain" },
  ]},
  { key: "word_of_day", label: "Word of the Day", emoji: "🔤", fields: [
    { column: "word_of_day_en", label: "Word (EN)", kind: "plain" },
    { column: "word_definition_en", label: "Definition (EN)", kind: "plain" },
    { column: "word_of_day_es", label: "Word (ES)", kind: "plain" },
    { column: "word_definition_es", label: "Definition (ES)", kind: "plain" },
  ]},
  { key: "today_principle", label: "Today's Principle", emoji: "🧠", fields: [
    { column: "today_principle_en", label: "EN", kind: "richtext" },
    { column: "today_principle_es", label: "ES", kind: "richtext" },
  ]},
  { key: "scripture", label: "Scripture", emoji: "📖", fields: [
    { column: "scripture_reference", label: "Reference", kind: "plain" },
    { column: "scripture_translation", label: "Translation", kind: "plain" },
    { column: "scripture_text_en", label: "Text (EN)", kind: "plain" },
    { column: "scripture_text_es", label: "Text (ES)", kind: "plain" },
  ]},
  { key: "scripture_reflection", label: "Scripture Reflection", emoji: "📖", fields: [
    { column: "scripture_reflection_en", label: "EN", kind: "richtext" },
    { column: "scripture_reflection_es", label: "ES", kind: "richtext" },
  ]},
  { key: "brain_science", label: "Brain Science", emoji: "🧠", fields: [
    { column: "brain_science_en", label: "EN", kind: "richtext" },
    { column: "brain_science_es", label: "ES", kind: "richtext" },
  ]},
  { key: "metacognition_prompt", label: "Metacognition", emoji: "🪞", fields: [
    { column: "metacognition_prompt_en", label: "EN", kind: "plain" },
    { column: "metacognition_prompt_es", label: "ES", kind: "plain" },
  ]},
  { key: "today_challenge", label: "Today's Challenge", emoji: "🎯", fields: [
    { column: "today_challenge_en", label: "EN", kind: "richtext" },
    { column: "today_challenge_es", label: "ES", kind: "richtext" },
  ]},
  { key: "sovereign_thought", label: "Today's Sovereign Thought", emoji: "🌿", fields: [
    { column: "sovereign_thought_en", label: "EN", kind: "richtext" },
    { column: "sovereign_thought_es", label: "ES", kind: "richtext" },
  ]},
  { key: "alignment_prompt", label: "Today's Alignment", emoji: "🪞", fields: [
    { column: "alignment_prompt_en", label: "EN", kind: "plain" },
    { column: "alignment_prompt_es", label: "ES", kind: "plain" },
  ]},
];

export function sectionByKey(key: string) {
  return SECTIONS.find((s) => s.key === key);
}

export type DailyResetRow = {
  id: number;
  day_number: number;
  date: string;
  theme: string | null;
  nataly_direction: string | null;

  title_en: string | null;
  title_es: string | null;
  word_of_day_en: string | null;
  word_of_day_es: string | null;
  word_definition_en: string | null;
  word_definition_es: string | null;

  sovereign_reset_en: string | null;
  sovereign_reset_es: string | null;
  today_principle_en: string | null;
  today_principle_es: string | null;

  scripture_reference: string | null;
  scripture_translation: string;
  scripture_text_en: string | null;
  scripture_text_es: string | null;
  scripture_reflection_en: string | null;
  scripture_reflection_es: string | null;

  brain_science_en: string | null;
  brain_science_es: string | null;
  metacognition_prompt_en: string | null;
  metacognition_prompt_es: string | null;
  today_challenge_en: string | null;
  today_challenge_es: string | null;
  sovereign_thought_en: string | null;
  sovereign_thought_es: string | null;
  alignment_prompt_en: string | null;
  alignment_prompt_es: string | null;

  days_remaining: number | null;
  season: string | null;
  admin_edited: boolean;
  admin_edited_sections: string[];
  needs_review: boolean;

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

export function isValidSection(key: string): key is SectionKey {
  return SECTIONS.some((s) => s.key === key);
}
