import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "../../../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { restoreVersionAction } from "../../actions";
import type { DailyResetRow } from "../../_lib/types";

export const dynamic = "force-dynamic";

type VersionRow = {
  id: number;
  version_number: number;
  change_type: string;
  created_at: string;
  created_by: string | null;
  snapshot: DailyResetRow;
};

const CHANGE_LABELS: Record<string, string> = {
  created: "Draft Created",
  ai_generated: "AI Generated",
  edited: "Nataly Edited",
  regenerated_section: "Section Regenerated",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  unpublished: "Unpublished",
  restored: "Restored from earlier version",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function VersionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("daily_reset_manager");
  const { id } = await params;

  const admin = createAdminClient();
  const [{ data: row }, { data: versions }] = await Promise.all([
    admin.from("daily_resets").select("day_number,theme").eq("id", id).single(),
    admin
      .from("daily_reset_versions")
      .select("id,version_number,change_type,created_at,created_by,snapshot")
      .eq("daily_reset_id", id)
      .order("version_number", { ascending: false }),
  ]);
  if (!row) notFound();

  const rows = (versions ?? []) as VersionRow[];

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/daily-reset-manager/${id}`} className="text-xs text-stone-400 hover:text-[#7a9a6e]">← Back to Day {row.day_number}</Link>
      <h1 className="text-xl font-semibold text-stone-800 mt-2 mb-1">Version History</h1>
      <p className="text-sm text-stone-500 mb-6">Day {row.day_number}{row.theme ? ` — ${row.theme}` : ""}. Restoring creates a new version; nothing is ever silently overwritten.</p>

      {rows.length === 0 ? (
        <div className="p-10 text-center text-stone-400 text-sm border border-stone-100 rounded-lg">No versions yet.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((v) => (
            <li key={v.id} className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-stone-800">Version {v.version_number} — {CHANGE_LABELS[v.change_type] ?? v.change_type}</div>
                <div className="text-xs text-stone-400 mt-0.5">{fmt(v.created_at)}{v.created_by ? ` · ${v.created_by}` : ""}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <details className="relative">
                  <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded border border-stone-200">View</summary>
                  <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white border border-stone-200 rounded-lg shadow-lg p-4 z-10 text-xs text-stone-600 space-y-2">
                    <div><strong>Status:</strong> {v.snapshot.status}</div>
                    <div><strong>Theme:</strong> {v.snapshot.theme ?? "—"}</div>
                    <div className="pt-2 border-t border-stone-100"><strong>Sovereign Reset (EN):</strong> <span dangerouslySetInnerHTML={{ __html: v.snapshot.sovereign_reset_en ?? "—" }} /></div>
                    <div><strong>Today&apos;s Principle (EN):</strong> <span dangerouslySetInnerHTML={{ __html: v.snapshot.today_principle_en ?? "—" }} /></div>
                    <div><strong>Scripture + Reflection (EN):</strong> <span dangerouslySetInnerHTML={{ __html: v.snapshot.scripture_reflection_en ?? "—" }} /></div>
                    <div><strong>Brain Science (EN):</strong> <span dangerouslySetInnerHTML={{ __html: v.snapshot.brain_science_en ?? "—" }} /></div>
                    <div><strong>Today&apos;s Challenge (EN):</strong> <span dangerouslySetInnerHTML={{ __html: v.snapshot.today_challenge_en ?? "—" }} /></div>
                    <div><strong>Sovereign Thought (EN):</strong> <span dangerouslySetInnerHTML={{ __html: v.snapshot.sovereign_thought_en ?? "—" }} /></div>
                  </div>
                </details>
                <form action={restoreVersionAction}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="versionId" value={v.id} />
                  <button type="submit" className="text-xs px-3 py-1.5 rounded border border-stone-200 hover:border-[#7a9a6e] text-stone-600 hover:text-[#5b7351]">Restore</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
