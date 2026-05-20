import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type {
  GoalMilestoneRow,
  GoalRow,
  GoalWithMilestones,
} from "@/lib/dashboard/types";
import { GOAL_CATEGORIES } from "./constants";
import {
  addMilestone,
  createGoal,
  deleteGoal,
  deleteMilestone,
  toggleGoalDone,
  toggleMilestone,
  updateGoalProgress,
} from "./actions";

type SearchParams = Promise<{ tab?: string }>;

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { tab } = await searchParams;
  const view: "active" | "done" = tab === "done" ? "done" : "active";

  const supabase = await createClient();
  const goalsRes = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });
  const goals = (goalsRes.data as GoalRow[] | null) ?? [];

  let goalsWithMilestones: GoalWithMilestones[] = goals.map((g) => ({
    ...g,
    milestones: [],
  }));
  if (goals.length > 0) {
    const msRes = await supabase
      .from("goal_milestones")
      .select("*")
      .in(
        "goal_id",
        goals.map((g) => g.id)
      )
      .order("position", { ascending: true });
    const all = (msRes.data as GoalMilestoneRow[] | null) ?? [];
    const byGoal = new Map<string, GoalMilestoneRow[]>();
    for (const m of all) {
      const arr = byGoal.get(m.goal_id) ?? [];
      arr.push(m);
      byGoal.set(m.goal_id, arr);
    }
    goalsWithMilestones = goals.map((g) => ({
      ...g,
      milestones: byGoal.get(g.id) ?? [],
    }));
  }

  const active = goalsWithMilestones.filter((g) => g.progress < 100);
  const done = goalsWithMilestones.filter((g) => g.progress >= 100);
  const visible = view === "active" ? active : done;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink">Goals</h1>
        <p className="text-sm text-stone mt-1">
          What did you do today toward your goals?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 rounded-lg border border-stone-200 bg-white p-4">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-stone-light font-semibold">
            ACTIVE
          </div>
          <div className="font-display text-2xl text-forest">
            {active.length}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.18em] text-stone-light font-semibold">
            DONE
          </div>
          <div className="font-display text-2xl text-sage">{done.length}</div>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-stone-200">
        <a
          href="/app/goals?tab=active"
          className={`px-4 py-2 text-sm border-b-2 ${
            view === "active"
              ? "border-sage text-forest"
              : "border-transparent text-stone"
          }`}
        >
          Active ({active.length})
        </a>
        <a
          href="/app/goals?tab=done"
          className={`px-4 py-2 text-sm border-b-2 ${
            view === "done"
              ? "border-sage text-forest"
              : "border-transparent text-stone"
          }`}
        >
          Done ({done.length})
        </a>
      </div>

      <details className="mb-6 rounded-lg border border-stone-200 bg-white">
        <summary className="cursor-pointer p-4 text-sm font-medium text-ink">
          + Add a new goal
        </summary>
        <form action={createGoal} className="p-4 border-t border-stone-200 grid gap-3">
          <input
            name="title"
            required
            placeholder="What are you building?"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              name="category"
              defaultValue="Personal"
              className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
            >
              {GOAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              name="deadline"
              type="date"
              className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
            />
          </div>
          <textarea
            name="why"
            rows={2}
            placeholder="Why this matters (optional)"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <button
            type="submit"
            className="self-start px-4 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest"
          >
            Add goal
          </button>
        </form>
      </details>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-12 text-center text-stone text-sm italic">
          {view === "active"
            ? "No active goals yet. Add one above."
            : "Nothing finished yet — keep going."}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </ul>
      )}
    </div>
  );
}

function GoalCard({ goal: g }: { goal: GoalWithMilestones }) {
  const isDone = g.progress >= 100;
  const totalMs = g.milestones.length;
  const doneMs = g.milestones.filter((m) => m.done).length;

  return (
    <li className="rounded-lg border border-stone-200 bg-white">
      <div className="flex items-start gap-3 p-4">
        <span
          aria-hidden
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isDone ? "bg-forest border-forest" : "border-sage-light/60"
          }`}
        >
          {isDone && (
            <svg
              className="w-3.5 h-3.5 text-white"
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
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2
              className={`font-display text-lg ${
                isDone ? "text-stone-light line-through" : "text-ink"
              }`}
            >
              {g.title}
            </h2>
            <span className="text-xs font-mono text-forest">{g.progress}%</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-stone">
            <span className="px-2 py-0.5 rounded bg-sage-pale/40 text-forest">
              {g.category}
            </span>
            {g.deadline && <span>by {g.deadline}</span>}
            {totalMs > 0 && (
              <span>
                {doneMs}/{totalMs} milestones
              </span>
            )}
          </div>
          {g.why && (
            <p className="text-sm italic text-stone mt-2 font-cormorant">
              &ldquo;{g.why}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
        <form action={toggleGoalDone}>
          <input type="hidden" name="id" value={g.id} />
          <input type="hidden" name="done" value={isDone ? "true" : "false"} />
          <button
            type="submit"
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              isDone
                ? "border border-stone-200 text-stone hover:bg-stone-50"
                : "bg-forest text-white hover:bg-forest-deep"
            }`}
          >
            {isDone ? "Reopen" : "Mark done"}
          </button>
        </form>
        <form action={updateGoalProgress} className="flex items-center gap-1">
          <input type="hidden" name="id" value={g.id} />
          <input
            type="number"
            name="progress"
            defaultValue={g.progress}
            min={0}
            max={100}
            className="w-16 px-2 py-1 text-xs border border-stone-200 rounded focus:border-sage outline-none"
          />
          <button
            type="submit"
            className="px-2 py-1 text-xs border border-stone-200 rounded hover:border-sage text-stone"
          >
            Set %
          </button>
        </form>
        <form action={deleteGoal} className="ml-auto">
          <input type="hidden" name="id" value={g.id} />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs border border-stone-200 text-stone-light hover:text-rose hover:border-rose rounded"
          >
            Delete
          </button>
        </form>
      </div>

      <div className="border-t border-stone-100 px-4 py-3 bg-cream-bg/40">
        <div className="text-[10px] tracking-[0.18em] text-stone-light font-semibold mb-2">
          MILESTONES
        </div>
        {g.milestones.length === 0 ? (
          <p className="text-xs italic text-stone-light mb-3 font-cormorant">
            Break this goal into the smaller wins along the way.
          </p>
        ) : (
          <ul className="space-y-1 mb-3">
            {g.milestones.map((m) => (
              <li key={m.id} className="flex items-center gap-2 group">
                <form action={toggleMilestone}>
                  <input type="hidden" name="id" value={m.id} />
                  <input
                    type="hidden"
                    name="done"
                    value={m.done ? "true" : "false"}
                  />
                  <button
                    type="submit"
                    aria-label={m.done ? "Mark not done" : "Mark done"}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      m.done
                        ? "bg-sage border-sage"
                        : "border-sage/60 hover:bg-sage-pale/40"
                    }`}
                  >
                    {m.done && (
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
                    m.done ? "text-stone-light line-through" : "text-ink"
                  }`}
                >
                  {m.text}
                </span>
                <form action={deleteMilestone}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    aria-label="Delete milestone"
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-light hover:text-rose transition"
                  >
                    ×
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addMilestone} className="flex gap-2">
          <input type="hidden" name="goalId" value={g.id} />
          <input
            name="text"
            required
            placeholder="Add a milestone…"
            className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded focus:border-sage outline-none bg-white"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium bg-sage text-white rounded hover:bg-forest"
          >
            Add
          </button>
        </form>
      </div>
    </li>
  );
}
