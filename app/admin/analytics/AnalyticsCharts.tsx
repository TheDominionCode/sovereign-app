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
import type { ClickRow, ConversionEvent } from "../_data";
import { clearAllVisitsAction } from "./actions";
import {
  excludeMyDeviceAction,
  includeMyDeviceAction,
} from "./exclusion-actions";

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

// One circle in the conversion funnel. Big serif number in the middle,
// colored ring around it, label + sublabel below. The ring + bg + text are
// configurable so each step can have its own tone (sage / amber / emerald).
function FunnelCircle({
  label,
  sublabel,
  value,
  ringColor,
  textColor,
  bgColor,
}: {
  label: string;
  sublabel: string;
  value: number;
  ringColor: string;
  textColor: string;
  bgColor: string;
}) {
  return (
    <div className="flex flex-col items-center text-center min-w-[88px]">
      <div
        className="w-[88px] h-[88px] sm:w-[112px] sm:h-[112px] rounded-full flex items-center justify-center shadow-sm"
        style={{
          backgroundColor: bgColor,
          border: `3px solid ${ringColor}`,
        }}
      >
        <div
          className="font-display text-3xl sm:text-4xl leading-none"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: textColor,
          }}
        >
          {value.toLocaleString()}
        </div>
      </div>
      <div className="mt-2 text-xs font-semibold text-stone-800">{label}</div>
      <div className="text-[10px] italic text-stone-500">{sublabel}</div>
    </div>
  );
}

// The little "→ 12.5% trial" arrow between two circles. Stacked vertically
// on mobile (because the row wraps), inline on wider screens.
function FunnelArrow({ pct, caption }: { pct: number; caption: string }) {
  return (
    <div className="flex flex-col items-center text-center px-1">
      <div className="text-stone-400 text-xl leading-none" aria-hidden>
        →
      </div>
      <div className="text-[11px] font-mono text-stone-600 mt-1">
        {pct.toFixed(1)}%
      </div>
      <div className="text-[10px] italic text-stone-500">{caption}</div>
    </div>
  );
}

// Reads the "don't count my devices" cookie set by the exclude server action.
// Used to render the toggle in its correct state without bouncing to the
// server. The cookie itself is set by the server action (10-year max-age)
// because that's also where we delete the last counted visit by IP.
function hasInternalCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c === "sov-internal=1");
}

export default function AnalyticsCharts({
  clicks,
  conversions,
}: {
  clicks: ClickRow[];
  conversions: ConversionEvent[];
}) {
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

  // Funnel counts in the current window. Three steps:
  //   1. Clicked the link  — every visit in clicks table
  //   2. Started free trial — auth.users row whose subscription opened
  //   3. Continued paying — subscription went active post-trial
  // Plus the conversion rate at each step.
  const funnel = useMemo(() => {
    const since = Date.now() - windowDays * 86_400_000;
    const recent = conversions.filter((c) => new Date(c.signupAt).getTime() >= since);
    const clicked = filtered.length;
    const trialed = recent.filter((c) => c.trialAt !== null).length;
    const paying = recent.filter((c) => c.paidAt !== null).length;
    const pct = (numerator: number, denominator: number) =>
      denominator > 0 ? (numerator / denominator) * 100 : 0;
    return {
      clicked,
      trialed,
      paying,
      clickToTrial: pct(trialed, clicked),
      trialToPaying: pct(paying, trialed),
      clickToPaying: pct(paying, clicked),
    };
  }, [conversions, windowDays, filtered]);

  return (
    <div className="space-y-6">
      {/* Exclude-my-device toggle — pinned to the TOP so it's the first thing
          seen. Click once on each device (phone + computer) to stop counting
          your own visits. The cookie lasts 10 years. */}
      <div className={`rounded-xl border p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap ${excluded ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${excluded ? "text-emerald-800" : "text-amber-800"}`}>
            {excluded ? "✓ Your visits are NOT being counted" : "⚠ Your visits ARE being counted"}
          </div>
          <div className="text-xs italic text-stone-500 mt-0.5">
            {excluded
              ? "This device is excluded. Do the same on every other phone/computer you use."
              : "Click to stop counting your own visits on this device. Do this on every phone and computer you use."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            startReset(async () => {
              if (excluded) {
                await includeMyDeviceAction();
              } else {
                await excludeMyDeviceAction();
              }
              window.location.reload();
            });
          }}
          disabled={isResetting}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
            excluded
              ? "bg-stone-200 text-stone-700 hover:bg-stone-300"
              : "bg-amber-600 text-white hover:bg-amber-700"
          }`}
        >
          {excluded ? "Start counting again" : "Don't count my visits"}
        </button>
      </div>

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

      {/* Conversion funnel — three circles in a row with the drop-off %
          between each one. On mobile the row wraps, but on tablet+ desktop
          you read left-to-right: clicked → trialed → paying. */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium">
            Conversion funnel (last {windowDays} days)
          </div>
          <div className="text-xs italic text-stone-500">
            of visits that turned into customers
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {/* Circle 1 — clicked */}
          <FunnelCircle
            label="Clicked"
            sublabel="the link"
            value={funnel.clicked}
            ringColor="#a8c090"
            textColor="#5b7351"
            bgColor="#f4f7ee"
          />

          <FunnelArrow pct={funnel.clickToTrial} caption="trial" />

          {/* Circle 2 — trial */}
          <FunnelCircle
            label="Free trial"
            sublabel="signed up"
            value={funnel.trialed}
            ringColor="#fbbf24"
            textColor="#b45309"
            bgColor="#fef3c7"
          />

          <FunnelArrow pct={funnel.trialToPaying} caption="paid" />

          {/* Circle 3 — paying */}
          <FunnelCircle
            label="Paying"
            sublabel="customers"
            value={funnel.paying}
            ringColor="#34d399"
            textColor="#047857"
            bgColor="#d1fae5"
          />
        </div>

        {/* Bottom-line headline */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-stone-700">
            <span className="font-semibold text-[#5b7351]">{funnel.paying.toLocaleString()}</span>{" "}
            of{" "}
            <span className="font-semibold text-[#5b7351]">{funnel.clicked.toLocaleString()}</span>{" "}
            visitors became paying customers.
          </div>
          <div
            className="font-display text-2xl leading-none text-[#5b7351]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {funnel.clickToPaying.toFixed(1)}%
          </div>
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
          the window is long. Always renders every day in the window, even
          when every count is 0 (matches Stan Store's "show the dashboard
          even on a quiet day" UX). */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-3">
          Day-by-day breakdown
        </div>
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
