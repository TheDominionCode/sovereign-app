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
