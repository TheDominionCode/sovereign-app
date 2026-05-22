import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { AffirmationPickRow, AffirmationRow } from "@/lib/dashboard/types";
import { todayISO } from "@/lib/dashboard/format";
import { PageHeader, EmptyState, TrashIcon } from "../_components/ui";
import {
  addAffirmation,
  clearTodaysPick,
  deleteAffirmation,
  setTodaysPick,
  toggleFavorite,
} from "./actions";

type SearchParams = Promise<{ cat?: string }>;

export default async function AffirmationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { cat = "All" } = await searchParams;

  const supabase = await createClient();
  const [affRes, pickRes] = await Promise.all([
    supabase.from("affirmations").select("*").order("created_at", { ascending: true }),
    supabase
      .from("affirmation_picks")
      .select("*")
      .eq("day", todayISO())
      .maybeSingle(),
  ]);
  const all = (affRes.data as AffirmationRow[] | null) ?? [];
  const pick = pickRes.data as AffirmationPickRow | null;
  const picked = pick ? all.find((a) => a.id === pick.affirmation_id) : undefined;

  const categories = ["All", "Favorites", ...Array.from(new Set(all.map((a) => a.category)))];
  const filtered = all.filter((a) => {
    if (cat === "Favorites") return a.favorite;
    if (cat !== "All") return a.category === cat;
    return true;
  });

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader
        title="Affirmations"
        subtitle="Words become beliefs. Beliefs become reality."
      />

      {picked ? (
        <div className="rounded-2xl bg-gradient-to-br from-cream-bg via-white to-cream-bg/50 border border-sage-pale px-6 py-8 mb-6 text-center">
          <div className="text-[10px] italic tracking-[0.2em] text-sage mb-3 font-cormorant">
            today&apos;s word
          </div>
          <p className="font-display text-2xl md:text-3xl italic leading-snug text-ink max-w-2xl mx-auto">
            &ldquo;{picked.text}&rdquo;
          </p>
          <form action={clearTodaysPick} className="mt-3">
            <button
              type="submit"
              className="text-[11px] italic text-stone-light hover:text-forest font-cormorant"
            >
              clear pick
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-sage-pale px-6 py-6 mb-6 text-center">
          <p className="text-sm italic text-stone font-cormorant">
            Pick today&apos;s word from your library below.
          </p>
        </div>
      )}

      <details className="mb-6 rounded-lg border border-stone-200 bg-white">
        <summary className="cursor-pointer p-4 text-sm font-medium text-ink">
          + Add affirmation
        </summary>
        <form action={addAffirmation} className="p-4 border-t border-stone-200 grid gap-3">
          <textarea
            name="text"
            required
            rows={2}
            placeholder="I am…"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <input
            name="category"
            defaultValue="Confidence"
            placeholder="Category"
            className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
          />
          <button
            type="submit"
            className="self-start px-4 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest"
          >
            Add
          </button>
        </form>
      </details>

      <div className="flex flex-wrap gap-2 mb-5">
        {categories.map((c) => (
          <a
            key={c}
            href={c === "All" ? "/app/affirmations" : `/app/affirmations?cat=${encodeURIComponent(c)}`}
            className={`px-3 py-1.5 text-xs rounded-full italic font-cormorant ${
              cat === c
                ? "bg-sage text-white"
                : "border border-stone-200 text-stone hover:border-sage"
            }`}
          >
            {c}
          </a>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState>No affirmations in this filter yet.</EmptyState>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="p-5 rounded-lg border border-stone-200 bg-white group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="font-display text-lg italic flex-1 leading-snug text-ink">
                  &ldquo;{a.text}&rdquo;
                </p>
                <form action={toggleFavorite}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="favorite" value={a.favorite ? "true" : "false"} />
                  <button
                    type="submit"
                    aria-label="Favorite"
                    className={`text-lg leading-none ${a.favorite ? "text-rose" : "text-stone-200 hover:text-rose"}`}
                  >
                    ♥
                  </button>
                </form>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] italic tracking-wide px-2 py-0.5 rounded bg-sage-pale/40 text-forest font-cormorant">
                  {a.category}
                </span>
                <div className="flex items-center gap-1">
                  <form action={setTodaysPick}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="px-2 py-1 text-[10px] tracking-wider rounded border border-stone-200 hover:border-sage text-stone"
                    >
                      USE TODAY
                    </button>
                  </form>
                  <form action={deleteAffirmation}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      aria-label="Delete"
                      className="p-1.5 text-stone-light hover:text-rose"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
