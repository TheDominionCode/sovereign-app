import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { TaskRow } from "@/lib/dashboard/types";
import { PRIORITIES } from "./constants";
import { createTask, deleteTask, toggleTask } from "./actions";

type SearchParams = Promise<{ day?: string }>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { day: dayParam } = await searchParams;
  const day = dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : todayISO();

  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("day", day)
    .order("done", { ascending: true })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });
  const tasks = (data as TaskRow[] | null) ?? [];
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-ink">Daily Planner</h1>
          <p className="text-sm text-stone mt-1">{fmtDate(day)}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/app/planner?day=${shiftDay(day, -1)}`}
            className="px-3 py-2 text-sm border border-stone-200 rounded hover:border-sage"
          >
            ←
          </a>
          <a
            href="/app/planner"
            className="px-3 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest"
          >
            Today
          </a>
          <a
            href={`/app/planner?day=${shiftDay(day, 1)}`}
            className="px-3 py-2 text-sm border border-stone-200 rounded hover:border-sage"
          >
            →
          </a>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 mb-5">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-stone mb-3">
          TO DO LIST
        </h2>
        <form action={createTask} className="flex flex-wrap items-center gap-2 mb-4">
          <input type="hidden" name="day" value={day} />
          <input
            name="title"
            required
            placeholder="Add a task for this day…"
            className="flex-1 min-w-[200px] px-3 py-2.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <select
            name="priority"
            defaultValue="normal"
            className="px-3 py-2.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 bg-sage text-white text-sm font-medium rounded hover:bg-forest"
          >
            Add
          </button>
        </form>

        {tasks.length === 0 ? (
          <div className="py-10 text-center text-sm italic text-stone font-cormorant">
            No tasks yet for this day. Add one above.
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs text-stone">
              {doneCount} of {tasks.length} done
            </div>
            <ul className="divide-y divide-stone-100">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 py-3 group"
                >
                  <form action={toggleTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <input
                      type="hidden"
                      name="done"
                      value={t.done ? "true" : "false"}
                    />
                    <button
                      type="submit"
                      aria-label={t.done ? "Mark not done" : "Mark done"}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        t.done
                          ? "bg-sage-light border-sage-light"
                          : "border-sage-light/40 hover:border-sage-light"
                      }`}
                    >
                      {t.done && (
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </form>
                  <span
                    className={`flex-1 text-sm ${
                      t.done ? "line-through text-stone-light" : "text-ink"
                    }`}
                  >
                    {t.title}
                  </span>
                  {(t.priority === "critical" || t.priority === "high") && (
                    <span className="text-[10px] tracking-wider text-forest">
                      {t.priority.toUpperCase()}
                    </span>
                  )}
                  <form action={deleteTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      aria-label="Delete task"
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-light hover:text-rose transition"
                    >
                      ×
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="text-xs italic text-stone-light font-cormorant">
        Time blocks, priorities, wins, gratitude, and the journal — those modules
        port over next, against the planner_days and planner_blocks tables.
      </p>
    </div>
  );
}
