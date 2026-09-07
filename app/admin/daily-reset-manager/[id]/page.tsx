import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "../../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateSectionAction,
  updateMetaAction,
  regenerateSectionAction,
  approveAction,
  schedulePublishAction,
  publishNowAction,
  unpublishAction,
} from "../actions";
import StatusBadge from "../_components/StatusBadge";
import RichTextField from "../_components/RichTextField";
import { SECTIONS, type DailyResetRow } from "../_lib/types";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  ai_generation_failed: "AI generation failed to return usable content. Try again, or write this section manually.",
  ai_regenerate_failed: "AI regeneration failed for that section. Try again, or edit it manually.",
  approval_required: "Approval required before publishing.",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function DailyResetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("daily_reset_manager");
  const { id } = await params;
  const { error } = await searchParams;

  const admin = createAdminClient();
  const { data: row } = await admin.from("daily_resets").select("*").eq("id", id).single();
  if (!row) notFound();
  const r = row as DailyResetRow;

  const canPublishNow = r.status === "approved" && r.admin_approved;

  return (
    <div className="max-w-3xl space-y-6 pb-16">
      <div>
        <Link href="/admin/daily-reset-manager" className="text-xs text-stone-400 hover:text-[#7a9a6e]">← All Daily Resets</Link>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <h1 className="text-xl font-semibold text-stone-800">Day {r.day_number} — {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</h1>
          <StatusBadge status={r.status} />
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">{ERROR_MESSAGES[error] ?? "Something went wrong."}</div>
      )}

      {/* Approval lock banner */}
      {r.status === "approved" && (
        <div className="px-4 py-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-800">
          ✓ Approved by Nataly · {fmt(r.approved_at)}
        </div>
      )}
      {r.status === "pending_approval" && r.ai_generated && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          ⚠ Changes require re-approval before this can be scheduled or published.
        </div>
      )}
      {r.status === "published" && (
        <div className="px-4 py-3 bg-[#f4f7ee] border border-[#d3e0c5] rounded-lg text-sm text-[#5b7351]">
          ● Live — published {fmt(r.published_at)}. Users are currently seeing this content.
        </div>
      )}

      {/* Meta */}
      <form action={updateMetaAction} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
        <input type="hidden" name="id" value={r.id} />
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Context</div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Theme</label>
          <input type="text" name="theme" defaultValue={r.theme ?? ""} className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Nataly&apos;s Direction</label>
          <textarea name="direction" rows={2} defaultValue={r.nataly_direction ?? ""} className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none resize-y" />
        </div>
        <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: "#5b7351" }}>Save Changes</button>
      </form>

      {/* Six sections */}
      {SECTIONS.map((s) => (
        <div key={s.key} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
          <div className="font-display text-lg text-stone-800">{s.emoji} {s.label}</div>

          <form action={updateSectionAction} className="space-y-3">
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="sectionKey" value={s.key} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-wider uppercase text-stone-400 mb-1">EN</label>
                <RichTextField name="content_en" defaultValue={r[`${s.key}_en` as keyof DailyResetRow] as string | null} placeholder="English content…" />
              </div>
              <div>
                <label className="block text-[10px] tracking-wider uppercase text-stone-400 mb-1">ES</label>
                <RichTextField name="content_es" defaultValue={r[`${s.key}_es` as keyof DailyResetRow] as string | null} placeholder="Contenido en español…" />
              </div>
            </div>
            <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: "#5b7351" }}>Save Changes</button>
          </form>

          <details>
            <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700 select-none">Regenerate with AI</summary>
            <form action={regenerateSectionAction} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="sectionKey" value={s.key} />
              <label className="block text-xs text-stone-500">Tell AI how you want this changed</label>
              <textarea name="instruction" rows={2} placeholder="Make this more powerful and less repetitive."
                className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none resize-y" />
              <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded border border-stone-300 text-stone-600 hover:border-[#7a9a6e] hover:text-[#5b7351]">Regenerate</button>
            </form>
          </details>
        </div>
      ))}

      {/* Preview */}
      <div className="flex gap-2 text-sm">
        {(["mobile", "tablet", "desktop"] as const).map((d) => (
          <Link key={d} href={`/admin-daily-reset-preview/${r.id}?device=${d}`} target="_blank"
            className="px-3 py-1.5 rounded border border-stone-200 text-stone-600 hover:border-[#7a9a6e] hover:text-[#5b7351] capitalize">
            Preview {d}
          </Link>
        ))}
        <Link href={`/admin/daily-reset-manager/${r.id}/versions`} className="px-3 py-1.5 rounded border border-stone-200 text-stone-600 hover:border-[#7a9a6e] hover:text-[#5b7351]">
          Version History
        </Link>
      </div>

      {/* Approval / publishing */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Approval &amp; Publishing</div>

        {(r.status === "draft" || r.status === "pending_approval") && (
          <details>
            <summary className="cursor-pointer inline-block px-4 py-2 text-sm font-semibold rounded-lg text-white select-none" style={{ backgroundColor: "#5b7351" }}>
              ✓ Approve Daily Reset
            </summary>
            <div className="mt-3 p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
              <p className="text-sm text-stone-600">Once approved, this Daily Reset can be published according to your chosen publish date. Users will not see it until it is published.</p>
              <form action={approveAction}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: "#5b7351" }}>Approve</button>
              </form>
            </div>
          </details>
        )}

        {r.status === "approved" && (
          <>
            <form action={schedulePublishAction} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Publish Date</label>
                <input type="hidden" name="id" value={r.id} />
                <input type="date" name="publish_date" required className="px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Publish Time</label>
                <input type="time" name="publish_time" defaultValue="06:00" className="px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
              </div>
              <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg border border-stone-300 text-stone-700 hover:border-[#7a9a6e]">Schedule Publish</button>
            </form>
            {r.publish_at && (
              <p className="text-xs text-stone-500">Currently scheduled for {fmt(r.publish_at)}. A background job checks every few minutes and publishes automatically once due.</p>
            )}

            <details>
              <summary className={`cursor-pointer inline-block px-4 py-2 text-sm font-semibold rounded-lg select-none ${canPublishNow ? "text-white" : "text-stone-400 bg-stone-100 cursor-not-allowed"}`} style={canPublishNow ? { backgroundColor: "#5b7351" } : {}}>
                Publish Now
              </summary>
              <div className="mt-3 p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                {canPublishNow ? (
                  <>
                    <p className="text-sm text-stone-600">Publish this Daily Reset? Users will immediately receive this content.</p>
                    <form action={publishNowAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: "#5b7351" }}>Yes, Publish</button>
                    </form>
                  </>
                ) : (
                  <p className="text-sm text-stone-500">Approval required before publishing.</p>
                )}
              </div>
            </details>
          </>
        )}

        {r.status === "published" && (
          <details>
            <summary className="cursor-pointer inline-block px-4 py-2 text-sm font-semibold rounded-lg border border-rose-300 text-rose-600 select-none">Unpublish</summary>
            <div className="mt-3 p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
              <p className="text-sm text-stone-600">Remove this Daily Reset from the active user experience? The content is kept, not deleted.</p>
              <form action={unpublishAction}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 text-white">Yes, Unpublish</button>
              </form>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
