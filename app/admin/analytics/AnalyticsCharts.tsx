"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ClickRow } from "../_data";
import { clearAllVisitsAction } from "./actions";

// Two stacked charts (Stan-Store-style):
//   1. Daily visits over a chosen window (7 / 30 / 90 days)
//   2. Hourly distribution for the same window
// Plus a referrer leaderboard underneath. All filtered by link_slug.

const FOREST = "#5b7351";
const SAGE = "#a8c090";

function startOfDay(iso: string) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtHourLabel(h: number) {
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${period}`;
}

function hostname(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Cookie helpers for the "don't count my devices" toggle. The cookie is read
// server-side by /api/visit before the row gets inserted, so once it's set on
// a device, that device's visits are silently dropped at the server.
function hasInternalCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c === "sov-internal=1");
}
function setInternalCookie(on: boolean) {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; secure" : "";
  if (on) {
    document.cookie = `sov-internal=1; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax${secure}`;
  } else {
    document.cookie = `sov-internal=; max-age=0; path=/; samesite=lax${secure}`;
  }
}

export default function AnalyticsCharts({ clicks }: { clicks: ClickRow[] }) {
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  const [slug, setSlug] = useState<string>("__all__");
  const [excluded, setExcluded] = useState<boolean>(false);

  // Read the cookie state once the page is mounted on the client.
  useEffect(() => {
    setExcluded(hasInternalCookie());
  }, []);

  const [isResetting, startReset] = useTransition();
  const onResetAll = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Delete every visit row in the analytics table?\n\nUse this when you want to start counting fresh. " +
        "There is no undo.",
    );
    if (!ok) return;
    startReset(async () => {
      await clearAllVisitsAction();
      // The server action revalidates the page so the next render shows zero;
      // we also reload to be sure the headline stats refetch.
      window.location.reload();
    });
  };

  const slugs = useMemo(() => {
    const set = new Set<string>();
    for (const c of clicks) set.add(c.link_slug);
    return Array.from(set).sort();
  }, [clicks]);

  const filtered = useMemo(() => {
    const since = Date.now() - windowDays * 86_400_000;
    return clicks.filter((c) => {
      if (slug !== "__all__" && c.link_slug !== slug) return false;
      return new Date(c.clicked_at).getTime() >= since;
    });
  }, [clicks, windowDays, slug]);

  const dailySeries = useMemo(() => {
    const counts = new Map<number, number>();
    // Seed every day in the window with 0 so empty days still show on the chart.
    const today = startOfDay(new Date().toISOString());
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      counts.set(d.getTime(), 0);
    }
    for (const c of filtered) {
      const key = startOfDay(c.clicked_at).getTime();
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([t, v]) => ({
      date: fmtDayLabel(new Date(t)),
      visits: v,
    }));
  }, [filtered, windowDays]);

  const hourlySeries = useMemo(() => {
    const buckets = new Array(24).fill(0) as number[];
    for (const c of filtered) {
      const h = new Date(c.clicked_at).getHours();
      buckets[h] += 1;
    }
    return buckets.map((v, h) => ({ hour: fmtHourLabel(h), visits: v }));
  }, [filtered]);

  const referrerCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of filtered) {
      const host = hostname(c.referrer) ?? "direct / no referrer";
      m.set(host, (m.get(host) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [filtered]);

  const totalVisits = filtered.length;
  const uniqueIps = useMemo(() => {
    const set = new Set<string>();
    for (const c of filtered) if (c.ip) set.add(c.ip);
    return set.size;
  }, [filtered]);

  // Headline counters (browser timezone). "Today" is midnight-local to now,
  // so it matches what the admin actually thinks of as "today" on her phone
  // — not server UTC time which could be hours off and confuse the count.
  const headline = useMemo(() => {
    const now = Date.now();
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayStart = todayMidnight.getTime();
    let today = 0;
    let last7 = 0;
    let last30 = 0;
    let last90 = 0;
    for (const c of clicks) {
      if (slug !== "__all__" && c.link_slug !== slug) continue;
      const t = new Date(c.clicked_at).getTime();
      if (t >= todayStart) today += 1;
      if (t >= now - 7 * 86_400_000) last7 += 1;
      if (t >= now - 30 * 86_400_000) last30 += 1;
      if (t >= now - 90 * 86_400_000) last90 += 1;
    }
    return { today, last7, last30, last90 };
  }, [clicks, slug]);

  return (
    <div className="space-y-6">
      {/* Headline stat cards — Today uses the admin's browser-local midnight
          so the number matches her actual "today." */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-3">Today</div>
          <div className="font-display text-3xl leading-none text-[#5b7351]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{headline.today.toLocaleString()}</div>
          <div className="text-xs italic text-stone-500 mt-2">Since midnight your time</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-3">Last 7 days</div>
          <div className="font-display text-3xl leading-none text-emerald-700" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{headline.last7.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-3">Last 30 days</div>
          <div className="font-display text-3xl leading-none text-[#5b7351]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{headline.last30.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-3">Last 90 days</div>
          <div className="font-display text-3xl leading-none text-stone-600" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{headline.last90.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setWindowDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                windowDays === d
                  ? "bg-[#5b7351] text-white"
                  : "text-stone-600 hover:text-[#5b7351]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white text-stone-700 focus:border-[#7a9a6e] outline-none"
        >
          <option value="__all__">All links</option>
          {slugs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="ml-auto text-xs text-stone-500">
          <span className="font-semibold text-[#5b7351]">{totalVisits.toLocaleString()}</span>{" "}
          visits · <span className="font-semibold text-[#5b7351]">{uniqueIps.toLocaleString()}</span>{" "}
          unique IPs (last {windowDays} days)
        </div>
      </div>

      {/* Exclude-my-device toggle. Sets a sov-internal=1 cookie that the
          /api/visit endpoint reads on every incoming request and drops the
          insert silently. Has to be set on each device the admin uses
          (laptop, phone, etc.) because cookies don't sync across devices. */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-sm font-medium text-stone-800">
            {excluded
              ? "This device is NOT being counted"
              : "This device IS being counted"}
          </div>
          <div className="text-xs italic text-stone-500 mt-0.5">
            Click below to stop counting your own visits from this browser. So your
            Facebook/Instagram-link traffic isn&apos;t inflated by your own
            previews. Do this on each phone/computer you use to check the site.
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !excluded;
            setInternalCookie(next);
            setExcluded(next);
          }}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
            excluded
              ? "bg-stone-200 text-stone-700 hover:bg-stone-300"
              : "bg-[#5b7351] text-white hover:bg-[#4a5e42]"
          }`}
        >
          {excluded ? "Start counting again" : "Don't count my visits"}
        </button>
      </div>

      {/* Daily chart */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-3">
          Visits per day
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#78716c" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#78716c" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#f4f7ee" }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #d6d3d1" }}
                formatter={(v: number) => [`${v} visits`, ""]}
              />
              <Bar dataKey="visits" fill={FOREST} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily breakdown table — same data as the chart but listed day-by-day
          with the explicit count next to it. Newest day on top, scrolls if
          the window is long. */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-3">
          Day-by-day breakdown
        </div>
        {dailySeries.every((d) => d.visits === 0) ? (
          <div className="text-sm italic text-stone-400 py-3">No visits in this window yet.</div>
        ) : (
          <ul className="divide-y divide-stone-100 max-h-[320px] overflow-y-auto">
            {[...dailySeries].reverse().map((row) => (
              <li
                key={row.date}
                className={`flex items-center justify-between py-2.5 ${
                  row.visits === 0 ? "opacity-40" : ""
                }`}
              >
                <span className="text-sm text-stone-800">{row.date}</span>
                <span className="text-sm font-mono text-[#5b7351] flex-shrink-0">
                  {row.visits.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hourly chart */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-3">
          Visits by hour of day (server time)
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlySeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#78716c" }} />
              <YAxis tick={{ fontSize: 11, fill: "#78716c" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#f4f7ee" }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #d6d3d1" }}
                formatter={(v: number) => [`${v} visits`, ""]}
              />
              <Bar dataKey="visits" fill={SAGE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Referrer leaderboard */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-3">
          Top referrers
        </div>
        {referrerCounts.length === 0 ? (
          <div className="text-sm italic text-stone-400 py-4">No visits in this window yet.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {referrerCounts.map(([host, count]) => (
              <li key={host} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-stone-800 truncate">{host}</span>
                <span className="text-sm font-mono text-[#5b7351] ml-3 flex-shrink-0">
                  {count.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reset all visit data — danger zone, lives at the bottom of the page
          so it's not too easy to hit by accident. Uses inline styles for the
          red button because the project's tailwind.config.ts redefines the
          `rose` color as a single hex, which deletes the rose-50/600/700
          palette and silently turns Tailwind's bg-rose-* utilities into
          no-ops. */}
      <div
        className="rounded-xl border p-5"
        style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}
      >
        <div
          className="text-[10px] tracking-[0.18em] uppercase font-semibold mb-2"
          style={{ color: "#b91c1c" }}
        >
          Danger zone
        </div>
        <div className="text-sm text-stone-700 mb-3">
          Wipe every visit row and start counting from zero. Useful right after you
          set the &ldquo;Don&apos;t count my visits&rdquo; cookie on your devices, so the
          leftover rows from earlier testing don&apos;t inflate your real numbers.
          <span className="font-semibold"> This cannot be undone.</span>
        </div>
        <button
          type="button"
          onClick={onResetAll}
          disabled={isResetting}
          className="px-4 py-2 text-xs font-medium rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
        >
          {isResetting ? "Wiping…" : "Reset all visit data"}
        </button>
      </div>
    </div>
  );
}
