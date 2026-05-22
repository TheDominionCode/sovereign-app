// Row-shape types for the dashboard tables. Hand-written for now so we don't
// pull in the supabase codegen dependency; keep in sync with
// supabase/migrations/20260520000000_dashboard_schema.sql.

export type TaskPriority = "critical" | "high" | "normal";

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  day: string; // YYYY-MM-DD
  done: boolean;
  priority: TaskPriority;
  category: string;
  time_label: string | null;
  recurring: boolean;
  created_at: string;
  updated_at: string;
};

export type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  deadline: string | null; // YYYY-MM-DD
  progress: number; // 0..100
  why: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalMilestoneRow = {
  id: string;
  goal_id: string;
  position: number;
  text: string;
  done: boolean;
  created_at: string;
};

export type GoalWithMilestones = GoalRow & { milestones: GoalMilestoneRow[] };

// ── enums ──────────────────────────────────────────────────────────────────
export type FlowLevel = "none" | "spotting" | "light" | "medium" | "heavy";
export type PfEntryType = "recurring" | "one-time";
export type PfFrequency = "weekly" | "biweekly" | "monthly" | "yearly";
export type CreditBureau = "experian" | "equifax" | "transunion";
export type ReflectionKind = "strengths" | "weaknesses" | "improvements" | "custom";
export type BoundaryKind = "expectations" | "deal_breakers" | "non_negotiables" | "custom";
export type RoutineKey = "morning" | "afternoon" | "evening" | "workout" | "reading";

// ── preferences / routines ──────────────────────────────────────────────────
export type UserPreferencesRow = {
  user_id: string;
  accent: string;
  lang: string;
  calendar_label: string;
  show_year_view: boolean;
  show_weekly_schedule: boolean;
  inspiration_img: string | null;
  week_start: string;
  currency: string;
  notify_daily: boolean;
  notify_milestones: boolean;
};

export type RoutineSettingsRow = {
  user_id: string;
  morning_label: string;
  afternoon_label: string;
  evening_label: string;
  workout_label: string;
  reading_label: string;
  morning_hidden: boolean;
  afternoon_hidden: boolean;
  evening_hidden: boolean;
  workout_hidden: boolean;
  reading_hidden: boolean;
};

export type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  position: number;
};

// ── planner ───────────────────────────────────────────────────────────────
export type PlannerDayRow = {
  user_id: string;
  day: string;
  priorities: string[];
  wins: string[];
  gratitude: string;
  journal: string;
  tomorrow: string;
  water_glasses: number;
  morning_done: boolean;
  afternoon_done: boolean;
  evening_done: boolean;
  workout_done: boolean;
  reading_done: boolean;
};

export type PlannerBlockRow = {
  user_id: string;
  day: string;
  hour: string;
  content: string;
};

export type PlannerHabitCompletionRow = {
  user_id: string;
  habit_id: string;
  day: string;
};

// ── calendar ────────────────────────────────────────────────────────────────
export type CalendarEventRow = {
  id: string;
  user_id: string;
  day: string;
  time_label: string | null;
  title: string;
  notes: string | null;
};

// ── affirmations ──────────────────────────────────────────────────────────
export type AffirmationRow = {
  id: string;
  user_id: string;
  text: string;
  category: string;
  favorite: boolean;
  custom: boolean;
};

export type AffirmationPickRow = {
  user_id: string;
  day: string;
  affirmation_id: string;
};

// ── vision board ────────────────────────────────────────────────────────────
export type VisionCardRow = {
  id: string;
  user_id: string;
  caption: string | null;
  img_url: string | null;
  why: string | null;
  letter: string | null;
  target_date: string | null;
  achieved: boolean;
  achieved_at: string | null;
  position: number;
};

export type VisionMetaRow = {
  user_id: string;
  year: number;
  statement: string;
  top_verse: string;
};

// ── notes ───────────────────────────────────────────────────────────────────
export type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  note_date: string;
};

// ── credentials ────────────────────────────────────────────────────────────
export type CredentialRow = {
  id: string;
  user_id: string;
  site: string;
  url: string | null;
  username: string | null;
  password: string | null;
  category: string;
  notes: string | null;
};

// ── reflections (Growth & Self) ─────────────────────────────────────────────
export type ReflectionListRow = {
  id: string;
  user_id: string;
  kind: ReflectionKind;
  title: string;
  hint: string | null;
  position: number;
};

export type ReflectionItemRow = {
  id: string;
  list_id: string;
  text: string;
  position: number;
};

export type ReflectionListWithItems = ReflectionListRow & {
  items: ReflectionItemRow[];
};

// ── boundaries ──────────────────────────────────────────────────────────────
export type BoundaryListRow = {
  id: string;
  user_id: string;
  kind: BoundaryKind;
  title: string;
  subtitle: string | null;
  color: string;
  position: number;
};

export type BoundaryItemRow = {
  id: string;
  list_id: string;
  text: string;
  position: number;
};

export type BoundaryListWithItems = BoundaryListRow & {
  items: BoundaryItemRow[];
};

// ── speak eloquently ────────────────────────────────────────────────────────
export type ElegantPhraseRow = {
  id: string;
  user_id: string;
  category: string;
  from_text: string;
  to_text: string;
  why: string | null;
};

// ── cycle & vitamins ────────────────────────────────────────────────────────
export type CycleEntryRow = {
  user_id: string;
  day: string;
  flow: FlowLevel;
  mood: string | null;
  symptoms: string[];
  notes: string | null;
};

export type VitaminRow = {
  id: string;
  user_id: string;
  name: string;
  dose: string | null;
  time_label: string | null;
  position: number;
};

export type VitaminDoseRow = {
  vitamin_id: string;
  taken_on: string;
};

// ── personal finance ────────────────────────────────────────────────────────
export type PfIncomeRow = {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  entry_type: PfEntryType;
  frequency: PfFrequency;
  entry_date: string;
  notes: string | null;
};

export type PfExpenseRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  entry_type: PfEntryType;
  frequency: PfFrequency;
  entry_date: string;
  notes: string | null;
};

export type PfSavingsGoalRow = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
  why: string | null;
};

export type PfInvestmentRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  kind: string;
  entry_date: string;
};

export type PfCreditScoreRow = {
  id: string;
  user_id: string;
  bureau: CreditBureau;
  score: number;
  recorded_on: string;
};
