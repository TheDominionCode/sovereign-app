import Link from "next/link";
import { requirePermission } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDraftAction } from "./actions";
import StatusBadge from "./_components/StatusBadge";
import type { DailyResetRow } from "./_lib/types";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Day Number and Date are required.",
  duplicate_day: "A Daily Reset for that Day Number already exists.",
  create_failed: "Couldn't create that Daily Reset. Try again.",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DailyResetManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("daily_reset_manager");
  const { error } = await searchParams;

  const admin = createAdminClient();
  const { data } = await admin
    .from("daily_resets")
    .select("id,day_number,date,theme,status,updated_at,publish_at")
    .order("day_number", { ascending: true });
  const rows = (data ?? []) as Pick<DailyResetRow, "id" | "day_number" | "date" | "theme" | "status" | "updated_at" | "publish_at">[];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-800">Daily Reset Manager</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          AI can create and edit content, but nothing reaches users until you explicitly approve and publish it.
        </p>
      </div>

      {error && (
        <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">
          {ERROR_MESSAGES[error] ?? "Something went wrong."}
        </div>
      )}

      {/* + CREATE DAILY RESET */}
      <details className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-[#5b7351] select-none">+ Create Daily Reset</summary>
        <form action={createDraftAction} className="px-5 pb-5 pt-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Day Number</label>
              <input type="number" name="day_number" required min={1}
                className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Date</label>
              <input type="date" name="date" required
                className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Theme</label>
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

      {/* List */}
      {rows.length === 0 ? (
        <div className="p-16 text-center text-stone-400 text-sm border border-stone-100 rounded-lg">
          No Daily Resets yet. Create the first one above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[10px] uppercase tracking-wider text-stone-400">
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Theme</th>
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
                  <td className="px-4 py-3 text-stone-600">{r.theme ?? "—"}</td>
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
