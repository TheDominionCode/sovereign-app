import Link from "next/link";
import { requirePermission } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDraftAction, generateTodayAction } from "./actions";
import StatusBadge from "./_components/StatusBadge";
import type { DailyResetRow } from "./_lib/types";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Date is required.",
  duplicate_date: "A Daily Reset for that date already exists.",
  create_failed: "Couldn't create that Daily Reset. Try again.",
};

type Row = Pick<DailyResetRow, "id" | "day_number" | "date" | "theme" | "status" | "updated_at" | "publish_at" | "season" | "title_en" | "needs_review">;

const VIEWS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "drafts", label: "Drafts" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
  { key: "history", label: "History" },
] as const;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function filterRows(rows: Row[], view: string, today: string): Row[] {
  switch (view) {
    case "today": return rows.filter((r) => r.date === today);
    case "upcoming": return rows.filter((r) => r.date > today);
    case "drafts": return rows.filter((r) => r.status === "draft" || r.status === "pending_approval");
    case "approved": return rows.filter((r) => r.status === "approved");
    case "published": return rows.filter((r) => r.status === "published");
    case "archived": return rows.filter((r) => r.status === "archived");
    case "history": return rows.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    default: return rows;
  }
}

export default async function DailyResetManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; view?: string; q?: string }>;
}) {
  await requirePermission("daily_reset_manager");
  const { error, view = "today", q } = await searchParams;

  const admin = createAdminClient();
  const { data } = await admin
    .from("daily_resets")
    .select("id,day_number,date,theme,status,updated_at,publish_at,season,title_en,needs_review")
    .order("date", { ascending: true });
  let rows = (data ?? []) as Row[];

  const today = new Date().toISOString().slice(0, 10);
  rows = filterRows(rows, view, today);
  if (q && q.trim()) {
    const needle = q.trim().toLowerCase();
    rows = rows.filter((r) => r.date.includes(needle) || (r.theme ?? "").toLowerCase().includes(needle) || (r.title_en ?? "").toLowerCase().includes(needle) || r.status.includes(needle));
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Daily Reset Manager</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            AI creates content automatically every day, but nothing reaches users until you explicitly approve and publish it.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/daily-reset-manager/settings" className="px-3 py-2 text-xs font-semibold rounded-lg border border-stone-200 text-stone-600 hover:border-stone-400 self-start">
            Daily AI Content Settings
          </Link>
          <form action={generateTodayAction}>
            <button type="submit" className="px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ backgroundColor: "#5b7351" }}>
              Generate Today
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">
          {ERROR_MESSAGES[error] ?? "Something went wrong."}
        </div>
      )}

      {/* + CREATE DAILY RESET (manual, for a specific past/future date) */}
      <details className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-[#5b7351] select-none">+ Create Daily Reset for a specific date</summary>
        <form action={createDraftAction} className="px-5 pb-5 pt-1 space-y-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Date</label>
            <input type="date" name="date" required
              className="w-full sm:w-64 px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
            <p className="text-[11px] text-stone-400 mt-1">Day number, days remaining, and the Sovereign season are calculated automatically from this date.</p>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Theme override (optional — leave blank to follow the season)</label>
            <input type="text" name="theme" placeholder="e.g. Self-Trust"
              className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Nataly&apos;s Direction (optional)</label>
            <textarea name="direction" rows={2} placeholder="e.g. Make this deeper and focus on keeping promises to yourself."
              className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none resize-y" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" name="intent" value="generate"
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: "#5b7351" }}>
              Generate with AI
            </button>
            <button type="submit" name="intent" value="save"
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-stone-200 text-stone-600 hover:border-stone-400">
              Save Draft
            </button>
          </div>
        </form>
      </details>

      {/* View tabs */}
      <div className="flex gap-1 flex-wrap border-b border-stone-200">
        {VIEWS.map((v) => (
          <Link key={v.key} href={`/admin/daily-reset-manager?view=${v.key}`}
            className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px ${view === v.key ? "border-[#5b7351] text-[#5b7351]" : "border-transparent text-stone-500 hover:text-stone-800"}`}>
            {v.label}
          </Link>
        ))}
      </div>

      <form className="flex gap-2" action="/admin/daily-reset-manager">
        <input type="hidden" name="view" value={view} />
        <input type="search" name="q" defaultValue={q ?? ""} placeholder="Search by date, theme, or title…"
          className="w-full max-w-sm px-3 py-1.5 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
        <button type="submit" className="px-3 py-1.5 text-xs rounded border border-stone-200 text-stone-600 hover:border-stone-400">Search</button>
      </form>

      {/* List */}
      {rows.length === 0 ? (
        <div className="p-16 text-center text-stone-400 text-sm border border-stone-100 rounded-lg">
          Nothing in this view yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[10px] uppercase tracking-wider text-stone-400">
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Season</th>
                <th className="px-4 py-3">Title / Theme</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-semibold text-stone-800">Day {r.day_number}</td>
                  <td className="px-4 py-3 text-stone-600">{fmt(r.date)}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">{r.season ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {r.title_en || r.theme || "—"}
                    {r.needs_review && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">needs review</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                    {r.status === "approved" && r.publish_at && (
                      <div className="text-[10px] text-stone-400 mt-1">Scheduled {fmt(r.publish_at)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{fmt(r.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs">
                      <Link href={`/admin/daily-reset-manager/${r.id}`} className="text-[#5b7351] font-medium hover:underline">Edit</Link>
                      <Link href={`/admin-daily-reset-preview/${r.id}`} target="_blank" className="text-stone-500 hover:text-[#5b7351]">Preview</Link>
                      <Link href={`/admin/daily-reset-manager/${r.id}/versions`} className="text-stone-500 hover:text-[#5b7351]">History</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
