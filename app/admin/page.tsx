import Link from "next/link";
import { formatPrice } from "@/lib/stripe/plans";
import { getCustomerRows, computeStats } from "./_data";
import { requirePermission } from "./guard";
import { hasPermission } from "@/lib/admin/permissions";
import CustomerTable from "./_components/CustomerTable";

// Overview — landing page when you open /admin. Stats tiles double as
// links into their detail pages. Each tile is only shown if the admin has
// permission for that section; the MRR tile + trial pipeline banner are
// gated on the 'revenue' permission specifically.
export default async function AdminOverviewPage() {
  const me = await requirePermission("overview");
  const rows = await getCustomerRows();
  const stats = computeStats(rows);
  const recent = rows.slice(0, 8);
  const canSeeMoney = hasPermission(me, "revenue");
  const canSee = (perm: Parameters<typeof hasPermission>[1]) => hasPermission(me, perm);

  // tone → text color for the big number. Background stays white; only the
  // numeric text picks up the accent so the card stays clean and legible.
  const numberColor: Record<string, string> = {
    forest:  "text-[#5b7351]",
    emerald: "text-emerald-700",
    amber:   "text-amber-600",
    rose:    "text-rose-600",
    stone:   "text-stone-600",
  };

  // Each tile requires the matching permission. The owner always sees them
  // all; a member admin only sees the sections she's been granted access to.
  //
  // "PAYING" reads from stats.active — Stripe only sets `active` AFTER
  // the first post-trial charge actually succeeds. A trial whose final
  // charge fails moves to `past_due` instead and shows in its own tile,
  // so the paying count never overstates real revenue.
  const tiles = [
    { href: "/admin",          label: "TOTAL SIGNUPS", value: String(stats.total),         hint: "all-time",              tone: "forest",  icon: "👥", visible: true },
    { href: "/admin/active",   label: "PAYING",        value: String(stats.active),        hint: "card charged · live",   tone: "emerald", icon: "✓", visible: canSee("active") },
    { href: "/admin/trial",    label: "ON TRIAL",      value: String(stats.trialing),      hint: "3-day free",            tone: "amber",   icon: "⏳", visible: canSee("trial") },
    { href: "/admin/active?past_due=1", label: "PAST DUE", value: String(stats.pastDue),   hint: "charge failed",         tone: "rose",    icon: "!", visible: canSee("active") && stats.pastDue > 0 },
    { href: "/admin/canceled", label: "CANCELED",      value: String(stats.canceled),      hint: "lost",                  tone: "rose",    icon: "✕", visible: canSee("canceled") },
    { href: "/admin/revenue",  label: "MRR",           value: formatPrice(stats.mrrCents), hint: "monthly recurring",     tone: "forest",  icon: "$", visible: canSeeMoney },
  ].filter((t) => t.visible);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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

      {/* Trial-pipeline revenue banner needs the 'revenue' permission —
          staff without it see the trial counts but not the dollar projection. */}
      {canSeeMoney && stats.trialPipelineCents > 0 && (
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
