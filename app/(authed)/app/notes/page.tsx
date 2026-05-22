import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { NoteRow } from "@/lib/dashboard/types";
import { fmtDate } from "@/lib/dashboard/format";
import { PageHeader, EmptyState, TrashIcon } from "../_components/ui";
import { createNote, deleteNote, togglePin, updateNote } from "./actions";

type SearchParams = Promise<{ q?: string }>;

export default async function NotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createClient();
  let req = supabase
    .from("notes")
    .select("*")
    .order("pinned", { ascending: false })
    .order("note_date", { ascending: false });
  if (query) req = req.ilike("title", `%${query}%`);
  const notes = ((await req).data as NoteRow[] | null) ?? [];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="Notes" subtitle="Brain dump. Tag. Pin. Find later." />

      <form className="mb-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search titles…"
          className="w-full px-4 py-2.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
        />
      </form>

      <details className="mb-6 rounded-lg border border-stone-200 bg-white">
        <summary className="cursor-pointer p-4 text-sm font-medium text-ink">
          + New note
        </summary>
        <form action={createNote} className="p-4 border-t border-stone-200 grid gap-3">
          <input
            name="title"
            required
            placeholder="Title"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <textarea
            name="body"
            rows={4}
            placeholder="Write it down…"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <input
            name="tags"
            placeholder="Tags (comma-separated)"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <label className="flex items-center gap-2 text-sm text-stone">
            <input type="checkbox" name="pinned" className="accent-sage" /> Pin to top
          </label>
          <button
            type="submit"
            className="self-start px-4 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest"
          >
            Add note
          </button>
        </form>
      </details>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-12">
          <EmptyState>
            {query ? "No notes match your search." : "No notes yet. Add your first above."}
          </EmptyState>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {notes.map((n) => (
            <div
              key={n.id}
              className="p-4 rounded-lg border border-stone-200 bg-white relative group"
            >
              {n.pinned && (
                <span className="absolute top-3 right-3 text-[10px] tracking-wider text-forest">
                  PINNED
                </span>
              )}
              <div className="font-medium text-ink mb-1 pr-12">{n.title}</div>
              <div className="text-xs font-mono text-stone-light mb-3">
                {fmtDate(n.note_date)}
              </div>
              {n.body && (
                <p className="text-sm text-stone whitespace-pre-line line-clamp-5">
                  {n.body}
                </p>
              )}
              {n.tags.length > 0 && (
                <div className="flex gap-1 mt-3 flex-wrap">
                  {n.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-sage-pale/40 text-forest"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition">
                <form action={togglePin}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="pinned" value={n.pinned ? "true" : "false"} />
                  <button
                    type="submit"
                    className="px-2 py-1 text-xs border border-stone-200 rounded hover:border-sage text-stone"
                  >
                    {n.pinned ? "Unpin" : "Pin"}
                  </button>
                </form>
                <form action={deleteNote}>
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    aria-label="Delete note"
                    className="px-2 py-1 text-xs border border-stone-200 rounded hover:border-rose hover:text-rose text-stone"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
              <details className="text-xs mt-2">
                <summary className="cursor-pointer text-stone-light hover:text-forest">
                  Edit
                </summary>
                <form action={updateNote} className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={n.id} />
                  <input
                    name="title"
                    defaultValue={n.title}
                    className="w-full px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
                  />
                  <textarea
                    name="body"
                    rows={3}
                    defaultValue={n.body}
                    className="w-full px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
                  />
                  <input
                    name="tags"
                    defaultValue={n.tags.join(", ")}
                    placeholder="Tags"
                    className="w-full px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-forest text-white text-xs rounded hover:bg-forest-deep"
                  >
                    Save
                  </button>
                </form>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
