import { ComingSoon } from "../_components/coming-soon";

export default function HabitsPage() {
  return (
    <ComingSoon
      title="Habits"
      intent="Built-in routines (morning, afternoon, evening, workout, reading) + custom daily habits, with per-day completion tracking."
      tables={[
        "habits",
        "routine_settings",
        "planner_habit_completions",
        "planner_days",
      ]}
    />
  );
}
