import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "../../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateSectionAction,
  updateMetaAction,
  regenerateSectionAction,
  regenerateEntireDayAction,
  approveAction,
  schedulePublishAction,
  publishNowAction,
  unpublishAction,
  archiveAction,
} from "../actions";
import StatusBadge from "../_components/StatusBadge";
import RichTextField from "../_components/RichTextField";
import { SECTIONS, type DailyResetRow } from "../_lib/types";
import { validateContent } from "../_lib/validate";

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

function isSingleLine(column: string) {
  return /reference|translation|^word_of_day|^word_definition|^title/.test(column);
}

export default async function DailyResetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; alreadyExists?: string }>;
}) {
  await requirePermission("daily_reset_manager");
  const { id } = await params;
  const { error, alreadyExists } = await searchParams;

  const admin = createAdminClient();
  const { data: row } = await admin.from("daily_resets").select("*").eq("id", id).single();
  if (!row) notFound();
  const r = row as DailyResetRow;

  const canPublishNow = r.status === "approved" && r.admin_approved;
  const editedSections = Array.isArray(r.admin_edited_sections) ? r.admin_edited_sections : [];
  const issues = validateContent(r);

  return (
    <div className="max-w-3xl space-y-6 pb-16">
      <div>
        <Link href="/admin/daily-reset-manager" className="text-xs text-stone-400 hover:text-[#7a9a6e]">← All Daily Resets</Link>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <h1 className="text-xl font-semibold text-stone-800">
            Day {r.day_number} — {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </h1>
          <StatusBadge status={r.status} />
        </div>
        <p className="text-xs text-stone-500 mt-1">{r.season ?? "—"} · {r.days_remaining ?? "—"} days remaining in the year{r.title_en ? ` · "${r.title_en}"` : ""}</p>
      </div>

      {error && (
        <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">{ERROR_MESSAGES[error] ?? "Something went wrong."}</div>
      )}
      {alreadyExists === "1" && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Today&apos;s content already exists — shown below. Use &quot;Regenerate Entire Day&quot; if you want a new AI version.
        </div>
      )}
      {issues.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <div className="font-semibold mb-1">⚠ Content needs review</div>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            {issues.map((i, idx) => <li key={idx}>{i.section}: {i.message}</li>)}
          </ul>
        </div>
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

      {/* Meta + full-day regenerate */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <form action={updateMetaAction} className="space-y-3">
          <input type="hidden" name="id" value={r.id} />
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Context</div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Theme override (blank = follow the season)</label>
            <input type="text" name="theme" defaultValue={r.theme ?? ""} className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Nataly&apos;s Direction</label>
            <textarea name="direction" rows={2} defaultValue={r.nataly_direction ?? ""} className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none resize-y" />
          </div>
          <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: "#5b7351" }}>Save Changes</button>
        </form>

        <details className="pt-2 border-t border-stone-100">
          <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700 select-none">Regenerate Entire Day</summary>
          <div className="mt-3 p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
            <p className="text-sm text-stone-600">Regenerate the entire daily experience? This may replace AI-generated sections.{editedSections.length > 0 ? " Manually edited sections will remain protected unless you explicitly choose to replace them." : ""}</p>
            <div className="flex gap-2 flex-wrap">
              <form action={regenerateEntireDayAction}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="replaceEdited" value="0" />
                <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: "#5b7351" }}>
                  Regenerate{editedSections.length > 0 ? " (keep my edits)" : ""}
                </button>
              </form>
              {editedSections.length > 0 && (
                <form action={regenerateEntireDayAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="replaceEdited" value="1" />
                  <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded border border-rose-300 text-rose-600 hover:bg-rose-50">
                    Replace everything, including my edits
                  </button>
                </form>
              )}
            </div>
          </div>
        </details>
      </div>

      {/* Every individually editable + regenerable section */}
      {SECTIONS.map((s) => {
        const isEdited = editedSections.includes(s.key);
        return (
          <div key={s.key} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-display text-lg text-stone-800">{s.emoji} {s.label}</div>
              {isEdited && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Manually edited</span>}
            </div>

            <form action={updateSectionAction} className="space-y-3">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="sectionKey" value={s.key} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {s.fields.map((f) => (
                  <div key={f.column}>
                    <label className="block text-[10px] tracking-wider uppercase text-stone-400 mb-1">{f.label}</label>
                    {f.kind === "richtext" ? (
                      <RichTextField name={`field_${f.column}`} defaultValue={r[f.column as keyof DailyResetRow] as string | null} placeholder="…" />
                    ) : (
                      <textarea
                        name={`field_${f.column}`}
                        defaultValue={(r[f.column as keyof DailyResetRow] as string) ?? ""}
                        rows={isSingleLine(f.column) ? 1 : 2}
                        className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none resize-y bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
              <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: "#5b7351" }}>Save Changes</button>
            </form>

            <details>
              <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700 select-none">Regenerate with AI</summary>
              <div className="mt-3 space-y-2">
                {isEdited && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    ⚠ This section has been manually edited. Regenerating will replace your version.
                  </p>
                )}
                <form action={regenerateSectionAction} className="space-y-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="sectionKey" value={s.key} />
                  <label className="block text-xs text-stone-500">Tell AI how you want this changed</label>
                  <textarea name="instruction" rows={2} placeholder="Make this more powerful and less repetitive."
                    className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none resize-y" />
                  <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded border border-stone-300 text-stone-600 hover:border-[#7a9a6e] hover:text-[#5b7351]">
                    {isEdited ? "Regenerate anyway" : "Regenerate"}
                  </button>
                </form>
              </div>
            </details>
          </div>
        );
      })}

      {/* Preview */}
      <div className="flex gap-2 text-sm flex-wrap">
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
                    <p className="text-sm text-stone-600">Publish this Sovereign Daily for all users?</p>
                    <form action={publishNowAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: "#5b7351" }}>Publish</button>
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

        {r.status !== "archived" && r.status !== "published" && (
          <form action={archiveAction}>
            <input type="hidden" name="id" value={r.id} />
            <button type="submit" className="text-xs text-stone-400 hover:text-rose-500 underline">Archive this day</button>
          </form>
        )}
      </div>
    </div>
  );
}
