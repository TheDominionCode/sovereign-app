import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveTestimonialAction,
  rejectTestimonialAction,
  unpublishTestimonialAction,
} from "./actions";
import { requirePermission } from "../guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TestimonialMeta = {
  id: string;
  name: string;
  quote: string;
  lang: string;
  photo_path: string | null;
  created_at: string;
};

type Bucket = "pending" | "approved";

// Read all testimonial JSON files in the given folder and resolve their
// metadata + public photo URLs. Files that don't parse are skipped silently.
async function listTestimonials(folder: Bucket): Promise<
  (TestimonialMeta & { photoUrl: string | null })[]
> {
  const admin = createAdminClient();
  const bucket = admin.storage.from("testimonials");
  const { data: files } = await bucket.list(folder, {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (!files) return [];

  const jsonFiles = files.filter((f) => f.name.endsWith(".json"));
  const items = await Promise.all(
    jsonFiles.map(async (f) => {
      const { data, error } = await bucket.download(`${folder}/${f.name}`);
      if (error || !data) return null;
      let meta: TestimonialMeta;
      try {
        const txt = await data.text();
        meta = JSON.parse(txt);
      } catch {
        return null;
      }
      let photoUrl: string | null = null;
      if (meta.photo_path) {
        const photoName = meta.photo_path.split("/").pop();
        const inFolderPath = `${folder}/${photoName}`;
        const { data: pub } = bucket.getPublicUrl(inFolderPath);
        photoUrl = pub.publicUrl;
      }
      return { ...meta, photoUrl };
    })
  );
  return items.filter(Boolean) as (TestimonialMeta & {
    photoUrl: string | null;
  })[];
}

type SearchParams = Promise<{
  approved?: string;
  rejected?: string;
  unpublished?: string;
}>;

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("testimonials");
  const { approved, rejected, unpublished } = await searchParams;
  const [pending, live] = await Promise.all([
    listTestimonials("pending"),
    listTestimonials("approved"),
  ]);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-sage-pale bg-cream-bg/60 px-5 py-4">
        <h2 className="font-display text-xl text-forest-deep mb-1">
          Testimonials submitted from the landing page
        </h2>
        <p className="text-sm text-stone leading-relaxed">
          Approve the ones you want to feature publicly. Approved testimonials
          show up in the testimonials section of the marketing page.
        </p>
      </div>

      {approved && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          ✓ Approved — now live on the landing page.
        </div>
      )}
      {rejected && (
        <div className="mb-4 rounded-md border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-600">
          Removed.
        </div>
      )}
      {unpublished && (
        <div className="mb-4 rounded-md border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-600">
          Unpublished from the landing page.
        </div>
      )}

      <h3 className="text-[11px] tracking-[0.2em] uppercase text-stone-500 font-medium mb-3">
        Pending review · {pending.length}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {pending.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm italic text-stone-500 sm:col-span-2">
            Nothing waiting for review.
          </div>
        )}
        {pending.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-stone-200 bg-white p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              {t.photoUrl ? (
                <img
                  src={t.photoUrl}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-stone-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 text-lg flex-shrink-0">
                  {(t.name?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-stone-800">
                  {t.name}
                </div>
                <div className="text-[10px] tracking-wider uppercase text-stone-400">
                  {new Date(t.created_at).toLocaleDateString()} ·{" "}
                  {t.lang.toUpperCase()}
                </div>
              </div>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed mb-4 italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex gap-2">
              <form action={approveTestimonialAction} className="inline">
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-forest text-white text-xs font-medium hover:bg-forest-deep transition-colors"
                >
                  Approve
                </button>
              </form>
              <form action={rejectTestimonialAction} className="inline">
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md border border-stone-300 text-stone-600 text-xs font-medium hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                >
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-[11px] tracking-[0.2em] uppercase text-stone-500 font-medium mb-3">
        Live on the landing page · {live.length}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {live.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm italic text-stone-500 sm:col-span-2">
            Nothing live yet — approve a pending one to publish.
          </div>
        )}
        {live.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              {t.photoUrl ? (
                <img
                  src={t.photoUrl}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-stone-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 text-lg flex-shrink-0">
                  {(t.name?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-stone-800">
                  {t.name}
                </div>
                <div className="text-[10px] tracking-wider uppercase text-emerald-700">
                  Live · {t.lang.toUpperCase()}
                </div>
              </div>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed mb-4 italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <form action={unpublishTestimonialAction} className="inline">
              <input type="hidden" name="id" value={t.id} />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md border border-stone-300 text-stone-600 text-xs font-medium hover:bg-stone-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
              >
                Unpublish
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
