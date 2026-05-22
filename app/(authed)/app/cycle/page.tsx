import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { CycleEntryRow, VitaminRow, VitaminDoseRow } from "@/lib/dashboard/types";
import { fmtDate, fmtLongDate, isValidISODate, todayISO } from "@/lib/dashboard/format";
import { PageHeader, Panel, EmptyState, TrashIcon, PlusIcon, CheckIcon } from "../_components/ui";
import { FLOW_OPTIONS, MOOD_OPTIONS, SYMPTOM_OPTIONS } from "./constants";
import {
  addVitamin,
  deleteVitamin,
  setFlow,
  setMood,
  setNotes,
  toggleDose,
  toggleSymptom,
} from "./actions";

type SearchParams = Promise<{ month?: string; day?: string }>;
const WD = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const pad = (n: number) => String(n).padStart(2, "0");

function computeStats(entries: CycleEntryRow[]) {
  const flowDays = entries
    .filter((e) => e.flow && e.flow !== "none")
    .map((e) => e.day)
    .sort();
  const starts: string[] = [];
  for (let i = 0; i < flowDays.length; i++) {
    if (i === 0 || new Date(flowDays[i]).getTime() - new Date(flowDays[i - 1]).getTime() > 7 * 864e5) {
      starts.push(flowDays[i]);
    }
  }
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    lengths.push((new Date(starts[i]).getTime() - new Date(starts[i - 1]).getTime()) / 864e5);
  }
  const avg = lengths.length ? Math.round(lengths.reduce((s, n) => s + n, 0) / lengths.length) : null;
  const last = starts.at(-1) ?? null;
  let next: string | null = null;
  if (last && avg) {
    const d = new Date(last + "T00:00:00");
    d.setDate(d.getDate() + avg);
    next = d.toISOString().slice(0, 10);
  }
  return { last, avg, next, logged: entries.length };
}

export default async function CyclePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { month, day } = await searchParams;
  const today = todayISO();
  const ym = month && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7);
  const [year, mon] = ym.split("-").map((s) => parseInt(s, 10));
  const selectedDay = day && isValidISODate(day) ? day : today;

  const supabase = await createClient();
  const [allRes, vitRes] = await Promise.all([
    supabase.from("cycle_entries").select("*").order("day", { ascending: true }),
    supabase.from("vitamins").select("*").order("position", { ascending: true }),
  ]);
  const all = (allRes.data as CycleEntryRow[] | null) ?? [];
  const vitamins = (vitRes.data as VitaminRow[] | null) ?? [];

  let dosesToday: VitaminDoseRow[] = [];
  if (vitamins.length > 0) {
    const dRes = await supabase
      .from("vitamin_doses")
      .select("*")
      .eq("taken_on", today)
      .in("vitamin_id", vitamins.map((v) => v.id));
    dosesToday = (dRes.data as VitaminDoseRow[] | null) ?? [];
  }
  const takenSet = new Set(dosesToday.map((d) => d.vitamin_id));

  const byDay = new Map(all.map((e) => [e.day, e]));
  const entry = byDay.get(selectedDay);
  const stats = computeStats(all);

  const firstWeekday = new Date(year, mon - 1, 1).getDay();
  const lastDate = new Date(year, mon, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: lastDate }, (_, i) => i + 1),
  ];
  const prevYm = mon === 1 ? `${year - 1}-12` : `${year}-${pad(mon - 1)}`;
  const nextYm = mon === 12 ? `${year + 1}-01` : `${year}-${pad(mon + 1)}`;

  const stat = (label: string, value: string) => (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="text-[10px] tracking-[0.2em] text-stone-light">{label}</div>
      <div className="font-display text-2xl text-forest mt-1">{value}</div>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="Cycle & Mood" subtitle="Track your flow. Honor how you feel. Notice the patterns." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stat("LAST PERIOD", stats.last ? fmtDate(stats.last) : "—")}
        {stat("AVG CYCLE", stats.avg ? `${stats.avg} days` : "—")}
        {stat("NEXT ESTIMATE", stats.next ? fmtDate(stats.next) : "—")}
        {stat("DAYS LOGGED", String(stats.logged))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Panel title={selectedDay === today ? `Today · ${fmtLongDate(selectedDay)}` : fmtLongDate(selectedDay)}>
            <div className="mb-4">
              <div className="text-[10px] tracking-wider text-stone-light mb-2">FLOW</div>
              <div className="flex flex-wrap gap-2">
                {FLOW_OPTIONS.map((f) => (
                  <form action={setFlow} key={f.id}>
                    <input type="hidden" name="day" value={selectedDay} />
                    <input type="hidden" name="flow" value={f.id} />
                    <button
                      type="submit"
                      className={`px-3 py-2 rounded-full text-xs font-medium border-2 ${
                        entry?.flow === f.id ? "ring-2 ring-offset-1 ring-sage border-sage" : "border-stone-200"
                      }`}
                      style={{ background: entry?.flow === f.id ? f.color : "white" }}
                    >
                      {f.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[10px] tracking-wider text-stone-light mb-2">HOW DO YOU FEEL?</div>
              <div className="grid grid-cols-4 gap-2">
                {MOOD_OPTIONS.map((m) => (
                  <form action={setMood} key={m.id}>
                    <input type="hidden" name="day" value={selectedDay} />
                    <input type="hidden" name="mood" value={m.id} />
                    <button
                      type="submit"
                      className={`w-full p-3 rounded-lg border-2 text-center ${
                        entry?.mood === m.id ? "border-sage bg-cream-bg" : "border-stone-200 hover:border-sage/50"
                      }`}
                    >
                      <div className="text-2xl">{m.emoji}</div>
                      <div className="text-[10px] mt-1 text-stone">{m.label}</div>
                    </button>
                  </form>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[10px] tracking-wider text-stone-light mb-2">SYMPTOMS</div>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_OPTIONS.map((s) => {
                  const active = (entry?.symptoms ?? []).includes(s);
                  return (
                    <form action={toggleSymptom} key={s}>
                      <input type="hidden" name="day" value={selectedDay} />
                      <input type="hidden" name="symptom" value={s} />
                      <button
                        type="submit"
                        className={`px-3 py-1.5 rounded-full text-xs border ${
                          active ? "bg-sage text-white border-sage" : "border-stone-200 text-stone hover:border-sage"
                        }`}
                      >
                        {s}
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>

            <form action={setNotes}>
              <input type="hidden" name="day" value={selectedDay} />
              <div className="text-[10px] tracking-wider text-stone-light mb-2">NOTES</div>
              <textarea
                name="notes"
                defaultValue={entry?.notes ?? ""}
                rows={2}
                placeholder="What's coming up for you today?"
                className="w-full px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
              />
              <button type="submit" className="mt-2 px-3 py-1.5 bg-forest text-white text-xs rounded hover:bg-forest-deep">
                Save notes
              </button>
            </form>
          </Panel>

          <Panel title="Vitamins & Supplements">
            <form action={addVitamin} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 mb-3">
              <input name="name" required placeholder="Vitamin / supplement" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
              <input name="dose" placeholder="Dose" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
              <input name="time" placeholder="When (AM/PM)" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
              <button type="submit" className="px-4 py-2 bg-sage text-white rounded hover:bg-forest flex items-center justify-center">
                <PlusIcon className="w-4 h-4" />
              </button>
            </form>
            {vitamins.length === 0 ? (
              <EmptyState>No vitamins added yet.</EmptyState>
            ) : (
              <div className="space-y-2">
                {vitamins.map((v) => {
                  const taken = takenSet.has(v.id);
                  return (
                    <div key={v.id} className="flex items-center gap-3 p-3 rounded border border-stone-200 group">
                      <form action={toggleDose}>
                        <input type="hidden" name="vitaminId" value={v.id} />
                        <input type="hidden" name="taken" value={taken ? "true" : "false"} />
                        <button
                          type="submit"
                          aria-label="Toggle dose"
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            taken ? "bg-sage border-sage text-white" : "border-stone-200 hover:border-sage"
                          }`}
                        >
                          {taken && <CheckIcon className="w-4 h-4" />}
                        </button>
                      </form>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{v.name}</div>
                        <div className="text-xs text-stone-light truncate">
                          {[v.dose, v.time_label].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <form action={deleteVitamin}>
                        <input type="hidden" name="id" value={v.id} />
                        <button type="submit" aria-label="Delete" className="opacity-0 group-hover:opacity-100 p-1 text-stone-light hover:text-rose transition">
                          <TrashIcon />
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <Panel title={`${MONTHS[mon - 1]} ${year}`} action={
          <div className="flex gap-1">
            <a href={`/app/cycle?month=${prevYm}`} className="px-2 py-1 text-xs border border-stone-200 rounded hover:border-sage">←</a>
            <a href={`/app/cycle?month=${nextYm}`} className="px-2 py-1 text-xs border border-stone-200 rounded hover:border-sage">→</a>
          </div>
        }>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-stone-light mb-1">
            {WD.map((d, i) => (<div key={i} className="text-center">{d}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              if (!c) return <div key={i} />;
              const iso = `${year}-${pad(mon)}-${pad(c)}`;
              const e = byDay.get(iso);
              const flow = e ? FLOW_OPTIONS.find((f) => f.id === e.flow) : undefined;
              const mood = e?.mood ? MOOD_OPTIONS.find((m) => m.id === e.mood) : undefined;
              const isSel = iso === selectedDay;
              const isToday = iso === today;
              return (
                <a
                  key={i}
                  href={`/app/cycle?month=${ym}&day=${iso}`}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] border ${
                    isSel ? "ring-2 ring-forest border-forest" : isToday ? "border-sage" : "border-stone-100"
                  }`}
                  style={{ background: flow && flow.id !== "none" ? flow.color : "white" }}
                >
                  <span className={flow && (flow.id === "medium" || flow.id === "heavy") ? "text-white" : "text-stone"}>
                    {c}
                  </span>
                  {mood && <span className="text-[10px] leading-none">{mood.emoji}</span>}
                </a>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
