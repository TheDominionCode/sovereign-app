import { requirePermission } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEntryAction, updateEntryAction, deleteEntryAction, toggleActiveAction } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  content_en: string;
  content_es: string;
  active: boolean;
  display_date?: string | null;
  sort_order?: number | null;
  created_at: string;
};
type Table = "daily_principles" | "daily_reflections" | "daily_questions" | "daily_intentions";

async function fetchAll(table: Table): Promise<Row[]> {
  const admin = createAdminClient();
  const { data } = await admin.from(table).select("*").order("id");
  return (data ?? []) as Row[];
}

function SectionManager({
  title,
  table,
  rows,
  hasDate,
  hasOrder,
}: {
  title: string;
  table: Table;
  rows: Row[];
  hasDate?: boolean;
  hasOrder?: boolean;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl text-forest-deep">{title}</h2>

      {/* Create form */}
      <form
        action={createEntryAction}
        className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
      >
        <input type="hidden" name="_table" value={table} />
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Add new</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">English</label>
            <textarea name="content_en" required rows={2} placeholder="English content…"
              className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-forest outline-none resize-y bg-white" />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Spanish</label>
            <textarea name="content_es" required rows={2} placeholder="Spanish content…"
              className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-forest outline-none resize-y bg-white" />
          </div>
        </div>
        {hasDate && (
          <div>
            <label className="block text-xs text-stone-500 mb-1">Schedule for date (optional — leave blank for rotation)</label>
            <input type="date" name="display_date"
              className="px-3 py-2 text-sm rounded border border-stone-200 focus:border-forest outline-none bg-white" />
          </div>
        )}
        {hasOrder && (
          <div>
            <label className="block text-xs text-stone-500 mb-1">Sort order</label>
            <input type="number" name="sort_order" defaultValue={rows.length + 1} min={0}
              className="w-24 px-3 py-2 text-sm rounded border border-stone-200 focus:border-forest outline-none bg-white" />
          </div>
        )}
        <button type="submit"
          className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
          style={{ backgroundColor: "#5b7351" }}>
          Add entry
        </button>
      </form>

      {/* Existing entries */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm italic text-stone-400">
          No entries yet. Add the first one above.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className={`rounded-xl border bg-white p-5 shadow-sm ${row.active ? "border-stone-200" : "border-stone-100 opacity-60"}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] tracking-wider uppercase text-stone-400 mb-0.5">EN</div>
                    <p className="text-sm text-stone-800">{row.content_en}</p>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-wider uppercase text-stone-400 mb-0.5">ES</div>
                    <p className="text-sm text-stone-700 italic">{row.content_es}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wider uppercase ${row.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-500 border-stone-200"}`}>
                    {row.active ? "Active" : "Inactive"}
                  </span>
                  {hasDate && row.display_date && (
                    <span className="text-[10px] text-stone-400">{row.display_date}</span>
                  )}
                  {hasOrder && row.sort_order != null && (
                    <span className="text-[10px] text-stone-400">order {row.sort_order}</span>
                  )}
                </div>
              </div>

              <details className="mb-3">
                <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700">Edit</summary>
                <form action={updateEntryAction} className="mt-3 space-y-3">
                  <input type="hidden" name="_table" value={table} />
                  <input type="hidden" name="id" value={row.id} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">English</label>
                      <textarea name="content_en" required rows={2} defaultValue={row.content_en}
                        className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-forest outline-none resize-y bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Spanish</label>
                      <textarea name="content_es" required rows={2} defaultValue={row.content_es}
                        className="w-full px-3 py-2 text-sm rounded border border-stone-200 focus:border-forest outline-none resize-y bg-white" />
                    </div>
                  </div>
                  {hasDate && (
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Schedule date (optional)</label>
                      <input type="date" name="display_date" defaultValue={row.display_date ?? ""}
                        className="px-3 py-2 text-sm rounded border border-stone-200 focus:border-forest outline-none bg-white" />
                    </div>
                  )}
                  {hasOrder && (
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Sort order</label>
                      <input type="number" name="sort_order" defaultValue={row.sort_order ?? 0} min={0}
                        className="w-24 px-3 py-2 text-sm rounded border border-stone-200 focus:border-forest outline-none bg-white" />
                    </div>
                  )}
                  <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: "#5b7351" }}>
                    Save changes
                  </button>
                </form>
              </details>

              <div className="flex items-center gap-2">
                <form action={toggleActiveAction}>
                  <input type="hidden" name="_table" value={table} />
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="active" value={String(row.active)} />
                  <button type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded"
                    style={{ backgroundColor: "#fafaf9", color: "#57534e", border: "1px solid #e7e5e4" }}>
                    {row.active ? "Deactivate" : "Activate"}
                  </button>
                </form>
                <form action={deleteEntryAction}>
                  <input type="hidden" name="_table" value={table} />
                  <input type="hidden" name="id" value={row.id} />
                  <button type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded"
                    style={{ backgroundColor: "#dc2626", color: "#fff" }}>
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function DailyExperiencePage() {
  await requirePermission("daily_experience");

  const [principles, reflections, questions, intentions] = await Promise.all([
    fetchAll("daily_principles"),
    fetchAll("daily_reflections"),
    fetchAll("daily_questions"),
    fetchAll("daily_intentions"),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-2xl text-forest-deep mb-1">Daily Experience</h1>
        <p className="text-sm text-stone-500 italic">
          Manage the rotating daily content shown to every Sovereign member. Content rotates by day of year unless a specific schedule date is set.
        </p>
        <ul className="mt-2 text-xs text-stone-400 space-y-0.5 list-disc list-inside">
          <li><strong className="text-stone-500">Principles</strong> — daily principle shown on the Today &amp; Mind pages</li>
          <li><strong className="text-stone-500">Reflections</strong> — Today&apos;s Reflection paragraph on the Today &amp; Mind pages</li>
          <li><strong className="text-stone-500">Reflection Questions</strong> — the question prompts in the Mind module (all active entries show as the list; add/remove to change what members answer)</li>
          <li><strong className="text-stone-500">Intentions Library</strong> — the word chips members pick as their daily intention</li>
        </ul>
      </div>

      <SectionManager title="Principles" table="daily_principles" rows={principles} hasDate />
      <SectionManager title="Reflections" table="daily_reflections" rows={reflections} hasDate />
      <SectionManager title="Reflection Questions (Mind module)" table="daily_questions" rows={questions} hasDate />
      <SectionManager title="Intentions Library" table="daily_intentions" rows={intentions} hasOrder />
    </div>
  );
}
