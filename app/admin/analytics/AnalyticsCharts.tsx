"use client";

import { useMemo, useState } from "react";
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

export default function AnalyticsCharts({ clicks }: { clicks: ClickRow[] }) {
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  const [slug, setSlug] = useState<string>("__all__");

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

  return (
    <div className="space-y-6">
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
    </div>
  );
}
