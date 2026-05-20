import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { GoalRow, TaskRow } from "@/lib/dashboard/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function SummaryPage() {
  const user = await requireActiveSubscription();
  const supabase = await createClient();
  const today = todayISO();

  const [tasksRes, goalsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("day", today)
      .order("done", { ascending: true })
      .order("priority", { ascending: true }),
    supabase
      .from("goals")
      .select("*")
      .lt("progress", 100)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const tasks = (tasksRes.data as TaskRow[] | null) ?? [];
  const goals = (goalsRes.data as GoalRow[] | null) ?? [];
  const tasksDone = tasks.filter((t) => t.done).length;
  const firstName = (user.email ?? "").split("@")[0];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-[11px] italic tracking-wide text-sage mb-1 font-cormorant">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="font-display text-3xl text-ink leading-tight">
          {greeting()},{" "}
          <span className="italic text-forest">{firstName}</span>.
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-2xl text-ink">Today</h2>
            <Link
              href="/app/planner"
              className="text-xs italic text-stone hover:text-forest font-cormorant"
            >
              {tasksDone} of {tasks.length} done →
            </Link>
          </div>
          <p className="text-xs italic text-stone-light mb-4 font-cormorant">
            The small things, in order.
          </p>
          {tasks.length === 0 ? (
            <Link
              href="/app/planner"
              className="block py-8 text-center text-sm italic text-stone hover:text-forest transition font-cormorant"
            >
              Nothing on the list yet — open your planner to add the first thing →
            </Link>
          ) : (
            <ul className="divide-y divide-stone-100">
              {tasks.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span
                    aria-hidden
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      t.done
                        ? "bg-sage-light border-sage-light"
                        : "border-sage-light/40"
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
                  </span>
                  <span
                    className={`flex-1 text-sm truncate ${
                      t.done ? "line-through text-stone-light" : "text-ink"
                    }`}
                  >
                    {t.title}
                  </span>
                  {(t.priority === "critical" || t.priority === "high") && (
                    <span className="text-[10px] tracking-wider text-forest">
                      PRIORITY
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-2xl text-ink">Goals in motion</h2>
            <Link
              href="/app/goals"
              className="text-xs italic text-stone hover:text-forest font-cormorant"
            >
              view all →
            </Link>
          </div>
          <p className="text-xs italic text-stone-light mb-4 font-cormorant">
            What you&apos;re building, one step at a time.
          </p>
          {goals.length === 0 ? (
            <Link
              href="/app/goals"
              className="block py-8 text-center text-sm italic text-stone hover:text-forest transition font-cormorant"
            >
              No goals yet — set the first one →
            </Link>
          ) : (
            <ul className="space-y-3">
              {goals.map((g) => (
                <li key={g.id}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm text-ink truncate pr-2">
                      {g.title}
                    </span>
                    <span className="text-xs font-mono text-forest">
                      {g.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-sage-light transition-all"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
