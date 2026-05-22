import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { CalendarEventRow } from "@/lib/dashboard/types";
import { fmtLongDate, isValidISODate, todayISO } from "@/lib/dashboard/format";
import { PageHeader, Panel, EmptyState, TrashIcon, PlusIcon } from "../_components/ui";
import { addEvent, deleteEvent } from "./actions";

type SearchParams = Promise<{ month?: string; day?: string }>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WD = ["S", "M", "T", "W", "T", "F", "S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { month, day } = await searchParams;
  const now = new Date();
  const ym = month && /^\d{4}-\d{2}$/.test(month) ? month : todayISO().slice(0, 7);
  const [year, mon] = ym.split("-").map((s) => parseInt(s, 10));
  const selectedDay = day && isValidISODate(day) ? day : null;

  const monthStart = `${year}-${pad(mon)}-01`;
  const lastDay = new Date(year, mon, 0).getDate();
  const monthEnd = `${year}-${pad(mon)}-${pad(lastDay)}`;

  const supabase = await createClient();
  const evRes = await supabase
    .from("calendar_events")
    .select("*")
    .gte("day", monthStart)
    .lte("day", monthEnd)
    .order("time_label", { ascending: true });
  const events = (evRes.data as CalendarEventRow[] | null) ?? [];
  const byDay = new Map<string, CalendarEventRow[]>();
  for (const e of events) {
    const arr = byDay.get(e.day) ?? [];
    arr.push(e);
    byDay.set(e.day, arr);
  }

  const firstWeekday = new Date(year, mon - 1, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ];

  const prevYm = mon === 1 ? `${year - 1}-12` : `${year}-${pad(mon - 1)}`;
  const nextYm = mon === 12 ? `${year + 1}-01` : `${year}-${pad(mon + 1)}`;
  const today = todayISO();

  const dayEvents = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        title="Calendar"
        subtitle="Plan your month. Click any day to add what you need to do."
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <a href={`/app/calendar?month=${prevYm}`} className="px-3 py-1.5 text-sm border border-stone-200 rounded hover:border-sage">←</a>
            <div className="font-display text-2xl text-ink">
              {MONTHS[mon - 1]} {year}
            </div>
            <a href={`/app/calendar?month=${nextYm}`} className="px-3 py-1.5 text-sm border border-stone-200 rounded hover:border-sage">→</a>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-stone-light mb-1">
            {WD.map((d, i) => (
              <div key={i} className="text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              if (!c) return <div key={i} />;
              const iso = `${year}-${pad(mon)}-${pad(c)}`;
              const has = byDay.has(iso);
              const isToday = iso === today;
              const isSel = iso === selectedDay;
              return (
                <a
                  key={i}
                  href={`/app/calendar?month=${ym}&day=${iso}`}
                  className={`aspect-square rounded flex flex-col items-center justify-center text-xs relative transition ${
                    isSel
                      ? "bg-forest text-white"
                      : isToday
                      ? "bg-sage-light text-white"
                      : "text-stone hover:bg-cream-bg"
                  }`}
                >
                  {c}
                  {has && !isSel && !isToday && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sage" />
                  )}
                </a>
              );
            })}
          </div>
        </Panel>

        <Panel title={selectedDay ? fmtLongDate(selectedDay) : "Select a day"}>
          {!selectedDay ? (
            <EmptyState>Click a day on the left to add or view events.</EmptyState>
          ) : (
            <>
              {dayEvents.length === 0 ? (
                <EmptyState>No events yet for this day.</EmptyState>
              ) : (
                <ul className="space-y-2 mb-4">
                  {dayEvents.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-start gap-2 p-2.5 rounded border border-stone-200 group"
                    >
                      <div className="flex-1 min-w-0">
                        {e.time_label && (
                          <span className="text-xs font-mono text-forest mr-2">
                            {e.time_label}
                          </span>
                        )}
                        <span className="text-sm text-ink">{e.title}</span>
                        {e.notes && (
                          <div className="text-xs text-stone mt-0.5">{e.notes}</div>
                        )}
                      </div>
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          aria-label="Delete"
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-light hover:text-rose transition"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <form action={addEvent} className="grid gap-2">
                <input type="hidden" name="day" value={selectedDay} />
                <input
                  name="time"
                  placeholder="Time (e.g. 2:30 PM)"
                  className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
                />
                <input
                  name="title"
                  required
                  placeholder="What's happening?"
                  className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
                />
                <input
                  name="notes"
                  placeholder="Notes (optional)"
                  className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest flex items-center justify-center gap-1.5"
                >
                  <PlusIcon className="w-4 h-4" /> Add event
                </button>
              </form>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
