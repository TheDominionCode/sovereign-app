import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { ElegantPhraseRow } from "@/lib/dashboard/types";
import { PageHeader, EmptyState, TrashIcon } from "../_components/ui";
import { ELEGANT_PHRASES, PHRASE_CATEGORIES, type Phrase } from "./constants";
import { addPhrase, deletePhrase } from "./actions";

type SearchParams = Promise<{ cat?: string; q?: string }>;

type Row = Phrase & { id?: string; custom?: boolean };

export default async function SpeakPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { cat = "All", q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const supabase = await createClient();
  const customRes = await supabase
    .from("elegant_phrases")
    .select("*")
    .order("category", { ascending: true });
  const custom = (customRes.data as ElegantPhraseRow[] | null) ?? [];

  const all: Row[] = [
    ...ELEGANT_PHRASES.map((p) => ({ ...p })),
    ...custom.map((p) => ({
      id: p.id,
      custom: true,
      category: p.category,
      from: p.from_text,
      to: p.to_text,
      why: p.why ?? "",
    })),
  ];

  const cats = ["All", ...PHRASE_CATEGORIES];
  const filtered = all.filter((p) => {
    if (cat !== "All" && p.category !== cat) return false;
    if (query && !(p.from + p.to + p.why).toLowerCase().includes(query)) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader
        title="Speak Eloquently"
        subtitle="Refine your language. The way you speak becomes the woman you are."
      />

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search… (e.g. 'sorry', 'busy', 'angry')"
          className="w-full px-4 py-2.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
        />
        {cat !== "All" && <input type="hidden" name="cat" value={cat} />}
      </form>

      <div className="flex flex-wrap gap-2 mb-5">
        {cats.map((c) => (
          <a
            key={c}
            href={c === "All" ? "/app/speak" : `/app/speak?cat=${encodeURIComponent(c)}`}
            className={`px-3 py-1.5 text-[10px] tracking-[0.18em] rounded-full uppercase ${
              cat === c
                ? "bg-sage text-white"
                : "border border-stone-200 text-stone hover:border-sage"
            }`}
          >
            {c}
          </a>
        ))}
      </div>

      <details className="mb-6 rounded-lg border border-stone-200 bg-white">
        <summary className="cursor-pointer p-4 text-sm font-medium text-ink">
          + Add your own phrase
        </summary>
        <form action={addPhrase} className="p-4 border-t border-stone-200 grid gap-3">
          <select
            name="category"
            defaultValue={PHRASE_CATEGORIES[0]}
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          >
            {PHRASE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            name="from"
            required
            placeholder="What you'd usually say"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <input
            name="to"
            required
            placeholder="The refined version"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <input
            name="why"
            placeholder="Why it works (optional)"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <button
            type="submit"
            className="self-start px-4 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest"
          >
            Save phrase
          </button>
        </form>
      </details>

      {filtered.length === 0 ? (
        <EmptyState>No phrases match. Try a different search.</EmptyState>
      ) : (
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <div
              key={p.id ?? `static-${i}`}
              className="rounded-lg border border-stone-200 bg-white p-5 group"
            >
              <div className="grid lg:grid-cols-2 gap-5">
                <div>
                  <div className="text-[10px] tracking-[0.2em] text-stone-light mb-2">
                    INSTEAD OF
                  </div>
                  <div className="text-sm text-stone italic font-cormorant">
                    &ldquo;{p.from}&rdquo;
                  </div>
                </div>
                <div className="border-l-2 border-sage-light pl-5">
                  <div className="text-[10px] tracking-[0.2em] text-forest mb-2">
                    SAY THIS
                  </div>
                  <div className="font-display text-base text-ink">
                    &ldquo;{p.to}&rdquo;
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between gap-3 mt-4 pt-3 border-t border-stone-100">
                <div className="flex-1 min-w-0">
                  {p.why && <div className="text-xs text-stone italic">{p.why}</div>}
                  <div className="text-[10px] tracking-wider text-sage mt-1">
                    {p.category.toUpperCase()}
                    {p.custom && " · YOURS"}
                  </div>
                </div>
                {p.custom && p.id && (
                  <form action={deletePhrase}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      aria-label="Delete"
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-light hover:text-rose transition"
                    >
                      <TrashIcon />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
