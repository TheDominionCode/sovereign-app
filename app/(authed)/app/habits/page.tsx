import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type {
  HabitRow,
  PlannerDayRow,
  PlannerHabitCompletionRow,
  RoutineSettingsRow,
} from "@/lib/dashboard/types";
import { fmtLongDate, todayISO } from "@/lib/dashboard/format";
import { PageHeader, Panel, ProgressRing } from "../_components/ui";
import { DailyHabits } from "../_components/daily-habits";
import { ROUTINES } from "../planner/constants";

export default async function HabitsPage() {
  await requireActiveSubscription();
  const day = todayISO();

  const supabase = await createClient();
  const [dayRes, routineRes, habitRes, compRes] = await Promise.all([
    supabase.from("planner_days").select("*").eq("day", day).maybeSingle(),
    supabase.from("routine_settings").select("*").maybeSingle(),
    supabase.from("habits").select("*").order("position", { ascending: true }),
    supabase.from("planner_habit_completions").select("*").eq("day", day),
  ]);
  const plannerDay = dayRes.data as PlannerDayRow | null;
  const routines = routineRes.data as RoutineSettingsRow | null;
  const habits = (habitRes.data as HabitRow[] | null) ?? [];
  const completed = new Set(
    ((compRes.data as PlannerHabitCompletionRow[] | null) ?? []).map((c) => c.habit_id)
  );

  const visibleRoutines = ROUTINES.filter((r) => !routines?.[r.hiddenField]);
  const total = visibleRoutines.length + habits.length;
  const doneCount =
    visibleRoutines.filter((r) => plannerDay?.[r.doneCol]).length +
    habits.filter((h) => completed.has(h.id)).length;

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <PageHeader title="Habits" subtitle={`${fmtLongDate(day)} — your rhythm for today`} />

      <div className="rounded-lg border border-stone-200 bg-white p-5 mb-5 flex items-center gap-5">
        <ProgressRing value={doneCount} max={total || 1} label="done" />
        <div>
          <div className="text-xs tracking-[0.2em] text-sage">TODAY</div>
          <div className="font-display text-lg text-ink">
            {doneCount} of {total} habits
          </div>
        </div>
      </div>

      <Panel title="Daily habits I'm tracking">
        <DailyHabits day={day} plannerDay={plannerDay} routines={routines} habits={habits} completed={completed} />
      </Panel>
    </div>
  );
}
