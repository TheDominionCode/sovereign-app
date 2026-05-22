import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { VisionCardRow, VisionMetaRow } from "@/lib/dashboard/types";
import { EmptyState, TrashIcon, CheckIcon } from "../_components/ui";
import { ImagePicker } from "./_components/image-picker";
import { addCard, deleteCard, saveMeta, toggleAchieved } from "./actions";

export default async function VisionPage() {
  await requireActiveSubscription();
  const supabase = await createClient();
  const [metaRes, cardsRes] = await Promise.all([
    supabase.from("vision_meta").select("*").maybeSingle(),
    supabase.from("vision_cards").select("*").order("position", { ascending: true }),
  ]);
  const meta = metaRes.data as VisionMetaRow | null;
  const cards = (cardsRes.data as VisionCardRow[] | null) ?? [];
  const year = meta?.year ?? new Date().getFullYear();

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="font-display text-4xl text-forest-deep tracking-tight">
            Vision Board <span className="text-ink">{year}</span>
          </h1>
          {meta?.top_verse && (
            <span className="text-xs tracking-[0.2em] font-bold text-forest">
              {meta.top_verse}
            </span>
          )}
        </div>
        {meta?.statement && (
          <p className="text-sm font-medium italic text-forest max-w-4xl mt-2 font-cormorant">
            &ldquo;{meta.statement}&rdquo;
          </p>
        )}
        <details className="text-xs mt-2">
          <summary className="cursor-pointer text-stone-light hover:text-forest">
            Edit header
          </summary>
          <form action={saveMeta} className="mt-2 grid gap-2 max-w-lg">
            <input name="year" type="number" defaultValue={year} className="px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
            <input name="top_verse" defaultValue={meta?.top_verse ?? ""} placeholder="Top verse / reference" className="px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
            <textarea name="statement" defaultValue={meta?.statement ?? ""} rows={2} placeholder="Vision statement" className="px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
            <button type="submit" className="self-start px-3 py-1.5 bg-forest text-white text-xs rounded hover:bg-forest-deep">Save header</button>
          </form>
        </details>
      </div>

      <details className="mb-6 rounded-lg border border-stone-200 bg-white">
        <summary className="cursor-pointer p-4 text-sm font-medium text-ink">
          + Add a card
        </summary>
        <form action={addCard} className="p-4 border-t border-stone-200 grid gap-3 max-w-lg">
          <ImagePicker />
          <input name="caption" placeholder="Caption (verse or short phrase)" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <input name="target_date" type="date" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <input name="why" placeholder="Why this matters (private)" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <textarea name="letter" rows={3} placeholder="A letter to yourself from the future…" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white font-cormorant" />
          <button type="submit" className="self-start px-4 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest">Add to board</button>
        </form>
      </details>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-12">
          <EmptyState>Your board is empty. Add your first card above.</EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cards.map((card) => (
            <div key={card.id} className="group relative rounded-md overflow-hidden bg-stone-100 aspect-[3/4]">
              {card.img_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.img_url} alt={card.caption ?? ""} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cream-bg to-stone-100 p-6">
                  <p className="text-center font-cormorant italic text-stone text-sm">
                    {card.why || "Add a picture or scripture"}
                  </p>
                </div>
              )}
              {card.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-8 pb-2 px-2">
                  <p className="text-center text-white text-[10px] font-bold tracking-[0.12em] uppercase">
                    {card.caption}
                  </p>
                </div>
              )}
              {card.achieved && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-sage text-white text-[9px] font-bold tracking-wider rounded">
                  ACHIEVED
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <form action={toggleAchieved}>
                  <input type="hidden" name="id" value={card.id} />
                  <input type="hidden" name="achieved" value={card.achieved ? "true" : "false"} />
                  <button type="submit" aria-label="Toggle achieved" className="p-1.5 rounded bg-white/90 hover:bg-cream-bg text-forest">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </button>
                </form>
                <form action={deleteCard}>
                  <input type="hidden" name="id" value={card.id} />
                  <button type="submit" aria-label="Delete" className="p-1.5 rounded bg-white/90 hover:bg-rose/10 text-stone hover:text-rose">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
