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

  // tone → text color for the big number. Background stays white; only the
  // numeric text picks up the accent so the card stays clean and legible.
  const numberColor: Record<string, string> = {
    forest:  "text-[#5b7351]",
    emerald: "text-emerald-700",
    amber:   "text-amber-600",
    rose:    "text-rose-600",
    stone:   "text-stone-600",
  };

  const tiles = [
    { href: "/admin",          label: "TOTAL SIGNUPS", value: String(stats.total),         hint: "all-time",          tone: "forest",  icon: "👥" },
    { href: "/admin/active",   label: "ACTIVE SUBS",   value: String(stats.active),        hint: "currently paying",  tone: "emerald", icon: "✓" },
    { href: "/admin/trial",    label: "ON TRIAL",      value: String(stats.trialing),      hint: "3-day free",        tone: "amber",   icon: "⏳" },
    { href: "/admin/canceled", label: "CANCELED",      value: String(stats.canceled),      hint: "lost",              tone: "rose",    icon: "✕" },
    { href: "/admin/revenue",  label: "MRR",           value: formatPrice(stats.mrrCents), hint: "monthly recurring", tone: "forest",  icon: "$" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:border-forest hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium">{t.label}</div>
              <span className="text-stone-400 text-sm">{t.icon}</span>
            </div>
            <div className={`font-display text-3xl leading-none ${numberColor[t.tone] ?? numberColor.forest}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {t.value}
            </div>
            <div className="text-xs italic text-stone-500 mt-2">{t.hint}</div>
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
