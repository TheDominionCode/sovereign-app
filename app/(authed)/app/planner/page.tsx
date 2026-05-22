import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type {
  HabitRow,
  PlannerDayRow,
  PlannerHabitCompletionRow,
  RoutineSettingsRow,
  TaskRow,
} from "@/lib/dashboard/types";
import { fmtLongDate, isValidISODate, shiftDay, todayISO } from "@/lib/dashboard/format";
import { PageHeader, Panel, EmptyState, CheckIcon, PlusIcon, TrashIcon } from "../_components/ui";
import { DailyHabits } from "../_components/daily-habits";
import { PRIORITIES } from "./constants";
import { createTask, deleteTask, savePlannerDay, toggleTask } from "./actions";

type SearchParams = Promise<{ day?: string }>;
const ta = "w-full px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { day: dayParam } = await searchParams;
  const day = dayParam && isValidISODate(dayParam) ? dayParam : todayISO();

  const supabase = await createClient();
  const [taskRes, dayRes, routineRes, habitRes, compRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("day", day).order("done").order("priority").order("created_at"),
    supabase.from("planner_days").select("*").eq("day", day).maybeSingle(),
    supabase.from("routine_settings").select("*").maybeSingle(),
    supabase.from("habits").select("*").order("position", { ascending: true }),
    supabase.from("planner_habit_completions").select("*").eq("day", day),
  ]);
  const tasks = (taskRes.data as TaskRow[] | null) ?? [];
  const plannerDay = dayRes.data as PlannerDayRow | null;
  const routines = routineRes.data as RoutineSettingsRow | null;
  const habits = (habitRes.data as HabitRow[] | null) ?? [];
  const completed = new Set(
    ((compRes.data as PlannerHabitCompletionRow[] | null) ?? []).map((c) => c.habit_id)
  );
  const pri = plannerDay?.priorities ?? [];
  const wins = plannerDay?.wins ?? [];

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader
        title="Daily Planner"
        subtitle={fmtLongDate(day)}
        action={
          <div className="flex items-center gap-2">
            <a href={`/app/planner?day=${shiftDay(day, -1)}`} className="px-3 py-2 text-sm border border-stone-200 rounded hover:border-sage">←</a>
            <a href="/app/planner" className="px-3 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest">Today</a>
            <a href={`/app/planner?day=${shiftDay(day, 1)}`} className="px-3 py-2 text-sm border border-stone-200 rounded hover:border-sage">→</a>
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="To-do list">
          <form action={createTask} className="flex gap-2 mb-3">
            <input type="hidden" name="day" value={day} />
            <input name="title" required placeholder="Add a task…" className="flex-1 px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
            <select name="priority" defaultValue="normal" className="px-2 py-2 rounded border border-stone-200 text-sm bg-white">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="submit" className="px-3 py-2 bg-sage text-white rounded hover:bg-forest"><PlusIcon className="w-4 h-4" /></button>
          </form>
          {tasks.length === 0 ? (
            <EmptyState>No tasks yet for this day.</EmptyState>
          ) : (
            <ul className="divide-y divide-stone-100">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5 group">
                  <form action={toggleTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="done" value={t.done ? "true" : "false"} />
                    <button type="submit" aria-label="Toggle" className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${t.done ? "bg-sage-light border-sage-light text-white" : "border-sage-light/40"}`}>
                      {t.done && <CheckIcon className="w-3 h-3" />}
                    </button>
                  </form>
                  <span className={`flex-1 text-sm ${t.done ? "line-through text-stone-light" : "text-ink"}`}>{t.title}</span>
                  {(t.priority === "critical" || t.priority === "high") && (
                    <span className="text-[10px] tracking-wider text-forest">{t.priority.toUpperCase()}</span>
                  )}
                  <form action={deleteTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" aria-label="Delete" className="opacity-0 group-hover:opacity-100 p-1 text-stone-light hover:text-rose transition"><TrashIcon className="w-3.5 h-3.5" /></button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Daily habits">
          <DailyHabits day={day} plannerDay={plannerDay} routines={routines} habits={habits} completed={completed} />
        </Panel>
      </div>

      <form action={savePlannerDay} className="mt-5">
        <input type="hidden" name="day" value={day} />
        <div className="grid lg:grid-cols-2 gap-5">
          <Panel title="Top 3 priorities">
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-display text-xl text-sage w-5">{i + 1}</span>
                  <input name={`p${i}`} defaultValue={pri[i] ?? ""} placeholder={`Priority ${i + 1}…`} className={ta} />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Daily wins">
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <input key={i} name={`w${i}`} defaultValue={wins[i] ?? ""} placeholder={`Win ${i + 1}…`} className={ta} />
              ))}
            </div>
          </Panel>
          <Panel title="Gratitude">
            <textarea name="gratitude" rows={3} defaultValue={plannerDay?.gratitude ?? ""} placeholder="What are you grateful for today?" className={ta} />
          </Panel>
          <Panel title="Journal">
            <textarea name="journal" rows={3} defaultValue={plannerDay?.journal ?? ""} placeholder="Free-form notes, thoughts, lessons…" className={ta} />
          </Panel>
          <Panel title="Tomorrow's setup" className="lg:col-span-2">
            <textarea name="tomorrow" rows={2} defaultValue={plannerDay?.tomorrow ?? ""} placeholder="3 things I'll do tomorrow before noon…" className={ta} />
          </Panel>
        </div>
        <button type="submit" className="mt-4 px-5 py-2.5 bg-forest text-white text-sm font-medium rounded hover:bg-forest-deep">
          Save the day
        </button>
      </form>
    </div>
  );
}
