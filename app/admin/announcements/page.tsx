import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "../guard";
import {
  saveAnnouncementAction,
  deactivateAnnouncementAction,
  reactivateAnnouncementAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  edit?: string;
  sent?: string;
  error?: string;
}>;

type AnnouncementRow = {
  id: string;
  title: string | null;
  body: string;
  emoji: string | null;
  audience: string;
  active: boolean;
  created_at: string;
};

const QUICK_EMOJIS = ["✨", "🌿", "💌", "⭐", "🤍", "❣️", "🌸", "🎉", "📣", "👑"];

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("announcements");
  const { edit, sent, error } = await searchParams;

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("announcements")
    .select("id, title, body, emoji, audience, active, created_at")
    .order("created_at", { ascending: false });
  const announcements = (rows ?? []) as AnnouncementRow[];

  // If ?edit=<id> is set, prefill the form. Otherwise it's blank for create.
  const editing = edit ? announcements.find((a) => a.id === edit) ?? null : null;

  // For each announcement, count how many users dismissed it.
  let dismissCounts: Record<string, number> = {};
  if (announcements.length > 0) {
    const { data: dismissals } = await admin
      .from("announcement_dismissals")
      .select("announcement_id")
      .in(
        "announcement_id",
        announcements.map((a) => a.id)
      );
    for (const d of dismissals ?? []) {
      const k = d.announcement_id as string;
      dismissCounts[k] = (dismissCounts[k] ?? 0) + 1;
    }
  }

  return (
    <div className="max-w-4xl">
      {/* Status banners */}
      {sent && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          📣 Announcement sent. Anyone who opens the app will see it next.
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {decodeURIComponent(error)}
        </div>
      )}

      {/* Compose form */}
      <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm mb-8">
        <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="font-display text-xl text-ink">
              {editing ? "Edit announcement" : "Send a message to your subscribers"}
            </h2>
            <p className="text-xs italic text-stone-500 mt-0.5">
              {editing
                ? "Re-saving an announcement re-sends it to everyone — even people who already dismissed it."
                : "Appears as a soft popup the next time any signed-in user opens the planner."}
            </p>
          </div>
          {editing && (
            <Link
              href="/admin/announcements"
              className="text-xs text-stone-500 hover:text-stone-800 hover:underline"
            >
              ← cancel edit, start fresh
            </Link>
          )}
        </div>

        <form action={saveAnnouncementAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          {/* Header */}
          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-1.5">
              Header (optional)
            </label>
            <input
              name="title"
              defaultValue={editing?.title ?? ""}
              maxLength={80}
              placeholder="e.g. From your founder, Nataly"
              className="block w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-forest outline-none"
            />
          </div>

          {/* Emoji picker — type your own or tap a quick one */}
          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-1.5">
              Emoji (optional)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                name="emoji"
                id="emoji-input"
                defaultValue={editing?.emoji ?? ""}
                maxLength={4}
                placeholder="✨"
                className="w-16 text-center px-2 py-2 border border-stone-200 rounded-lg text-lg focus:border-forest outline-none"
              />
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  // Tiny inline-JS shortcut: tap to fill the input.
                  // No client-side state needed since the form is server-rendered.
                  // eslint-disable-next-line react/no-unknown-property
                  data-emoji={e}
                  onClick={undefined}
                  className="text-lg p-1.5 rounded hover:bg-stone-100 transition emoji-quick"
                  title={`Use ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <p className="text-[10px] italic text-stone-400 mt-1.5">
              Type your own or tap one of the suggestions to fill the box.
            </p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-1.5">
              Message
            </label>
            <textarea
              name="body"
              required
              defaultValue={editing?.body ?? ""}
              rows={5}
              maxLength={800}
              placeholder="Type whatever you want here. A welcome, a thank-you, a new feature — anything they should know about."
              className="block w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:border-forest outline-none resize-none"
            />
            <p className="text-[10px] italic text-stone-400 mt-1.5">
              Up to 800 characters. Plain text — no HTML.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-cream-bg"
              style={{ backgroundColor: "#3d5c34" }}
            >
              {editing ? "💾 Save changes" : "🚀 Send to everyone"}
            </button>
          </div>
        </form>
      </section>

      {/* History */}
      <section>
        <h2 className="font-display text-lg text-ink mb-3">Past announcements</h2>
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-sm italic text-stone-500">
            Nothing sent yet. Your first announcement will land here.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {announcements.map((a) => {
              const dismissed = dismissCounts[a.id] ?? 0;
              return (
                <li
                  key={a.id}
                  className={`rounded-xl border p-4 ${
                    a.active ? "border-stone-200 bg-white" : "border-stone-100 bg-stone-50/50 opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="text-2xl flex-shrink-0">{a.emoji || "📣"}</div>
                    <div className="flex-1 min-w-0">
                      {a.title && (
                        <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-0.5">
                          {a.title}
                        </div>
                      )}
                      <div className="text-sm text-stone-800 whitespace-pre-wrap break-words">{a.body}</div>
                      <div className="text-[11px] italic text-stone-400 mt-1.5">
                        {new Date(a.created_at).toLocaleString()} ·{" "}
                        {dismissed} dismissed
                        {!a.active && <span className="ml-1.5 text-rose-600 not-italic">· deactivated</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Link
                        href={`/admin/announcements?edit=${a.id}`}
                        className="text-xs text-forest hover:underline"
                      >
                        ✏️ Edit
                      </Link>
                      {a.active ? (
                        <form action={deactivateAnnouncementAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <button className="text-xs text-stone-500 hover:text-rose-600">
                            🚫 Deactivate
                          </button>
                        </form>
                      ) : (
                        <form action={reactivateAnnouncementAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <button className="text-xs text-stone-500 hover:text-emerald-700">
                            ✓ Reactivate
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Tiny client-side script: clicking an emoji-quick button fills the
          emoji input. Keeping it as a server component + sprinkled script
          avoids pulling a "use client" boundary for a 6-line interaction. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelectorAll('.emoji-quick').forEach(b => {
              b.addEventListener('click', () => {
                const inp = document.getElementById('emoji-input');
                if (inp) inp.value = b.getAttribute('data-emoji');
              });
            });
          `,
        }}
      />
    </div>
  );
}
