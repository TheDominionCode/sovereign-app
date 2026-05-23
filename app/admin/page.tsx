import Link from "next/link";
import { formatPrice } from "@/lib/stripe/plans";
import { getCustomerRows, computeStats } from "./_data";
import CustomerTable from "./_components/CustomerTable";

// Overview — landing page when you open /admin. Stats tiles double as
// links into their detail pages.
export default async function AdminOverviewPage() {
  const rows = await getCustomerRows();
  const stats = computeStats(rows);
  const recent = rows.slice(0, 8);

  // tone → background gradient + text color for the circle. Tiles are
  // clickable cards; the number lives inside a colored circle at the top
  // for visual punch.
  const toneClass: Record<string, string> = {
    forest:  "bg-gradient-to-br from-[#7a9a6e] to-[#3d5c34] text-white",
    emerald: "bg-gradient-to-br from-[#a8c090] to-[#5b7351] text-white",
    amber:   "bg-gradient-to-br from-amber-300 to-amber-600 text-white",
    stone:   "bg-gradient-to-br from-stone-300 to-stone-500 text-white",
  };

  const tiles = [
    { href: "/admin",          label: "Total signups", value: String(stats.total),         hint: "all-time",          tone: "forest" },
    { href: "/admin/active",   label: "Active subs",   value: String(stats.active),        hint: "currently paying",  tone: "emerald" },
    { href: "/admin/trial",    label: "On trial",      value: String(stats.trialing),      hint: "3-day free",        tone: "amber" },
    { href: "/admin/canceled", label: "Canceled",      value: String(stats.canceled),      hint: "lost",              tone: "stone" },
    { href: "/admin/revenue",  label: "MRR",           value: formatPrice(stats.mrrCents), hint: "monthly recurring", tone: "forest" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-lg border border-stone-200 bg-white p-4 hover:border-forest hover:shadow-sm transition group flex flex-col items-center text-center"
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-sm mb-3 transition group-hover:scale-105 ${toneClass[t.tone] ?? toneClass.forest}`}>
              <span className="font-display text-2xl leading-none">{t.value}</span>
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">{t.label}</div>
            <div className="text-[10px] italic text-stone-400 mt-1">{t.hint} →</div>
          </Link>
        ))}
      </div>

      {stats.trialPipelineCents > 0 && (
        <Link
          href="/admin/trial"
          className="block mb-6 rounded-md border border-amber-200 bg-amber-50/40 px-4 py-3 text-xs italic text-amber-900 hover:bg-amber-50"
        >
          Trial pipeline: {" "}
          <span className="font-medium not-italic text-amber-900">{formatPrice(stats.trialPipelineCents)}</span>
          {" "}— revenue if every current trial converts at their selected plan.
        </Link>
      )}

      <section className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg text-ink">Recent signups</h2>
          <span className="text-xs text-stone-light">last {recent.length}</span>
        </div>
        <CustomerTable rows={recent} emptyMessage="No signups yet — your first will land here." />
      </section>

      <p className="text-xs italic text-stone-light">
        Click any stat above to drill in. Need to add an assistant?{" "}
        <Link href="/admin/admins" className="text-forest hover:underline not-italic">Manage admins →</Link>
      </p>
    </div>
  );
}
