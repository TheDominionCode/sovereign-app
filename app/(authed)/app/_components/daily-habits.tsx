import type {
  HabitRow,
  PlannerDayRow,
  RoutineSettingsRow,
} from "@/lib/dashboard/types";
import { ROUTINES } from "../planner/constants";
import { CheckIcon, PlusIcon, TrashIcon } from "./ui";
import {
  addHabit,
  deleteHabit,
  setWater,
  toggleHabitCompletion,
  toggleRoutine,
} from "../planner/actions";

type Props = {
  day: string;
  plannerDay: PlannerDayRow | null;
  routines: RoutineSettingsRow | null;
  habits: HabitRow[];
  completed: Set<string>;
};

export function DailyHabits({ day, plannerDay, routines, habits, completed }: Props) {
  const water = plannerDay?.water_glasses ?? 0;

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        {ROUTINES.filter((r) => !routines?.[r.hiddenField]).map((r) => {
          const done = Boolean(plannerDay?.[r.doneCol]);
          const label = routines?.[r.labelField] ?? r.key;
          return (
            <form
              action={toggleRoutine}
              key={r.key}
              className={`flex items-center gap-2 p-3 rounded border transition ${
                done ? "bg-cream-bg border-sage-light" : "bg-white border-stone-200"
              }`}
            >
              <input type="hidden" name="day" value={day} />
              <input type="hidden" name="col" value={r.doneCol} />
              <button
                type="submit"
                aria-label="Toggle"
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  done ? "bg-sage border-sage text-white" : "border-sage-light"
                }`}
              >
                {done && <CheckIcon className="w-3.5 h-3.5" />}
              </button>
              <span className={`flex-1 text-sm ${done ? "line-through text-stone-light" : "text-ink"}`}>
                {label}
              </span>
            </form>
          );
        })}

        {habits.map((h) => {
          const done = completed.has(h.id);
          return (
            <div
              key={h.id}
              className={`flex items-center gap-2 p-3 rounded border group transition ${
                done ? "bg-cream-bg border-sage-light" : "bg-white border-stone-200"
              }`}
            >
              <form action={toggleHabitCompletion}>
                <input type="hidden" name="habitId" value={h.id} />
                <input type="hidden" name="day" value={day} />
                <input type="hidden" name="done" value={done ? "true" : "false"} />
                <button
                  type="submit"
                  aria-label="Toggle"
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    done ? "bg-sage border-sage text-white" : "border-sage-light"
                  }`}
                >
                  {done && <CheckIcon className="w-3.5 h-3.5" />}
                </button>
              </form>
              <span className={`flex-1 text-sm ${done ? "line-through text-stone-light" : "text-ink"}`}>
                {h.name}
              </span>
              <form action={deleteHabit}>
                <input type="hidden" name="id" value={h.id} />
                <button
                  type="submit"
                  aria-label="Delete habit"
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-light hover:text-rose transition"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <form action={addHabit} className="flex gap-2 mb-4">
        <input
          name="name"
          required
          placeholder="Add a habit — Pilates, journaling, no sugar…"
          className="flex-1 px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-sage text-white text-sm rounded hover:bg-forest flex items-center gap-1"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Add
        </button>
      </form>

      <div>
        <div className="text-[10px] tracking-[0.2em] text-sage mb-2">WATER (8 GLASSES)</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <form action={setWater} key={n}>
              <input type="hidden" name="day" value={day} />
              <input type="hidden" name="n" value={n === water ? n - 1 : n} />
              <button
                type="submit"
                aria-label={`${n} glasses`}
                className={`w-5 h-7 rounded-b-md border-2 ${
                  n <= water ? "bg-sage-light border-sage" : "border-stone-200 bg-white"
                }`}
              />
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
