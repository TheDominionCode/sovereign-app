import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type {
  ReflectionItemRow,
  ReflectionListRow,
  ReflectionListWithItems,
} from "@/lib/dashboard/types";
import { PageHeader, Panel, EmptyState, PlusIcon, TrashIcon } from "../_components/ui";
import {
  addReflectionItem,
  addReflectionList,
  deleteReflectionItem,
  deleteReflectionList,
  updateReflectionList,
} from "./actions";

export default async function GrowthPage() {
  await requireActiveSubscription();
  const supabase = await createClient();

  const listsRes = await supabase
    .from("reflection_lists")
    .select("*")
    .order("position", { ascending: true });
  const lists = (listsRes.data as ReflectionListRow[] | null) ?? [];

  let withItems: ReflectionListWithItems[] = lists.map((l) => ({ ...l, items: [] }));
  if (lists.length > 0) {
    const itemsRes = await supabase
      .from("reflection_items")
      .select("*")
      .in(
        "list_id",
        lists.map((l) => l.id)
      )
      .order("position", { ascending: true });
    const items = (itemsRes.data as ReflectionItemRow[] | null) ?? [];
    const byList = new Map<string, ReflectionItemRow[]>();
    for (const it of items) {
      const arr = byList.get(it.list_id) ?? [];
      arr.push(it);
      byList.set(it.list_id, arr);
    }
    withItems = lists.map((l) => ({ ...l, items: byList.get(l.id) ?? [] }));
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        title="Growth & Self"
        subtitle="Know your strengths. Own your growth."
        action={
          <form action={addReflectionList}>
            <button
              type="submit"
              className="px-3 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest flex items-center gap-1.5"
            >
              <PlusIcon /> New section
            </button>
          </form>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {withItems.map((list) => (
          <Panel key={list.id}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-display text-lg text-ink">{list.title}</h3>
              {list.kind === "custom" && (
                <form action={deleteReflectionList}>
                  <input type="hidden" name="id" value={list.id} />
                  <button
                    type="submit"
                    aria-label="Delete section"
                    className="p-1 text-stone-light hover:text-rose"
                  >
                    <TrashIcon />
                  </button>
                </form>
              )}
            </div>
            {list.hint && (
              <p className="text-xs italic text-stone-light mb-3 font-cormorant">
                {list.hint}
              </p>
            )}

            <ul className="space-y-2 mb-3">
              {list.items.length === 0 ? (
                <EmptyState>Nothing yet — add your first below.</EmptyState>
              ) : (
                list.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center gap-2 p-2.5 rounded border border-stone-200 bg-cream-bg/40 group"
                  >
                    <span className="flex-1 text-sm text-ink">{it.text}</span>
                    <form action={deleteReflectionItem}>
                      <input type="hidden" name="id" value={it.id} />
                      <button
                        type="submit"
                        aria-label="Delete"
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-light hover:text-rose transition"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </li>
                ))
              )}
            </ul>

            <form action={addReflectionItem} className="flex gap-2 mb-3">
              <input type="hidden" name="listId" value={list.id} />
              <input
                name="text"
                required
                placeholder="Add one…"
                className="flex-1 px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-sage text-white text-sm rounded hover:bg-forest"
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            </form>

            <details className="text-xs">
              <summary className="cursor-pointer text-stone-light hover:text-forest">
                Rename / edit hint
              </summary>
              <form action={updateReflectionList} className="mt-2 space-y-2">
                <input type="hidden" name="id" value={list.id} />
                <input
                  name="title"
                  defaultValue={list.title}
                  className="w-full px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white"
                />
                <input
                  name="hint"
                  defaultValue={list.hint ?? ""}
                  placeholder="Short hint…"
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
          </Panel>
        ))}
      </div>
    </div>
  );
}
