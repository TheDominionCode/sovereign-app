import Link from "next/link";
import { formatPrice, PLANS } from "@/lib/stripe/plans";
import { getCustomerRows } from "../_data";
import { requirePermission } from "../guard";

// Revenue view — focused on money. Gated by the 'revenue' permission;
// members without it are bounced back to the overview before this page
// renders. MRR by plan, trial pipeline, conversion rates, customer list.

type SearchParams = Promise<{ period?: string }>;

// Start of the current calendar month in the server's local time. Used to
// scope the Month-to-Date view: subscribers whose current period started
// in this month (new starts + renewals) count toward MTD revenue.
function startOfThisMonthIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function AdminRevenuePage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("revenue");
  const { period } = await searchParams;
  const isMtd = period === "mtd";
  const all = await getCustomerRows();
  // MTD view scopes "active" to subscribers whose current period began
  // this calendar month — that's a close proxy for "money this month"
  // without round-tripping every Stripe invoice. Other counts (trialing,
  // canceled) stay all-time because they aren't time-bound metrics.
  const monthStart = startOfThisMonthIso();
  const activeAll = all.filter((r) => r.status === "active");
  const active = isMtd
    ? activeAll.filter((r) => r.periodStart && r.periodStart >= monthStart)
    : activeAll;
  const trialing = all.filter((r) => r.status === "trialing");
  const canceled = all.filter((r) => r.canceled);

  // Per-plan breakdown for active subs.
  const byPlan: Record<string, { count: number; mrrCents: number; revenuePerCycleCents: number }> = {};
  for (const p of PLANS) {
    byPlan[p.id] = { count: 0, mrrCents: 0, revenuePerCycleCents: 0 };
  }
  for (const r of active) {
    if (!r.plan) continue;
    const b = byPlan[r.plan.id];
    if (b) {
      b.count += 1;
      b.mrrCents += r.plan.monthlyEquivalentCents;
      b.revenuePerCycleCents += r.plan.amountCents;
    }
  }

  const mrrCents = active.reduce((s, r) => s + (r.plan?.monthlyEquivalentCents ?? 0), 0);
  const arrCents = mrrCents * 12;
  const trialPipelineCents = trialing.reduce((s, r) => s + (r.plan?.amountCents ?? 0), 0);

  // Conversion: of users who ever had a sub (active + canceled), what % are still active?
  const everSubbed = active.length + canceled.length;
  const retention = everSubbed > 0 ? Math.round((active.length / everSubbed) * 100) : null;

  // ARPU = MRR / active.
  const arpuCents = active.length > 0 ? Math.round(mrrCents / active.length) : 0;

  // MTD revenue = sum of plan amounts for subs whose period started this
  // month. New starts + same-month renewals both count.
  const mtdRevenueCents = isMtd
    ? active.reduce((s, r) => s + (r.plan?.amountCents ?? 0), 0)
    : 0;

  return (
    <div>
      {/* Time-window toggle: All time vs Month to date. */}
      <div className="flex items-center gap-2 mb-5">
        <Link
          href="/admin/revenue"
          className={`px-3 py-1.5 text-xs rounded-full border transition ${
            !isMtd
              ? "bg-forest text-cream-bg border-forest"
              : "border-stone-200 text-stone-600 hover:border-forest hover:text-forest"
          }`}
        >
          All time
        </Link>
        <Link
          href="/admin/revenue?period=mtd"
          className={`px-3 py-1.5 text-xs rounded-full border transition ${
            isMtd
              ? "bg-forest text-cream-bg border-forest"
              : "border-stone-200 text-stone-600 hover:border-forest hover:text-forest"
          }`}
        >
          Month to date
        </Link>
        {isMtd && (
          <span className="ml-2 text-[11px] italic text-stone-500">
            since {new Date(monthStart).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
          </span>
        )}
      </div>

      {/* MTD-only headline: dollars collected this month from new starts +
          renewals — sits above the standard MRR/ARR row when MTD is on. */}
      {isMtd && (
        <div className="rounded-lg p-5 mb-3" style={{ background: "#3d5c34", color: "#f1ebda" }}>
          <div className="text-[10px] tracking-[0.18em] uppercase">Revenue this month</div>
          <div className="font-display text-4xl mt-1">{formatPrice(mtdRevenueCents)}</div>
          <div className="text-[11px] italic mt-1 opacity-80">
            new starts &amp; renewals whose billing cycle began on or after the 1st · {active.length} subs counted
          </div>
        </div>
      )}

      {/* Top headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg p-5" style={{ background: "#3d5c34", color: "#f1ebda" }}>
          <div className="text-[10px] tracking-[0.18em] uppercase">MRR</div>
          <div className="font-display text-3xl mt-1">{formatPrice(mrrCents)}</div>
          <div className="text-[11px] italic mt-1 opacity-80">monthly recurring</div>
        </div>
        <div className="rounded-lg p-5" style={{ background: "#3d5c34", color: "#f1ebda" }}>
          <div className="text-[10px] tracking-[0.18em] uppercase">ARR</div>
          <div className="font-display text-3xl mt-1">{formatPrice(arrCents)}</div>
          <div className="text-[11px] italic mt-1 opacity-80">annualized run rate</div>
        </div>
        <div className="rounded-lg p-5 border border-stone-200 bg-white">
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500">ARPU</div>
          <div className="font-display text-3xl text-forest-deep mt-1">{formatPrice(arpuCents)}</div>
          <div className="text-[11px] italic text-stone-400 mt-1">avg revenue / active user / mo</div>
        </div>
        <div className="rounded-lg p-5 border border-stone-200 bg-white">
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500">Trial pipeline</div>
          <div className="font-display text-3xl text-forest-deep mt-1">{formatPrice(trialPipelineCents)}</div>
          <div className="text-[11px] italic text-stone-400 mt-1">if everyone converts</div>
        </div>
      </div>

      {/* By plan */}
      <section className="rounded-lg border border-stone-200 bg-white overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-stone-100">
          <h2 className="font-display text-lg text-ink">Revenue by plan</h2>
          <p className="text-xs italic text-stone-light">Active subscribers only.</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-[10px] tracking-[0.18em] uppercase text-stone-500">
            <tr>
              <th className="px-4 py-2 font-medium">Plan</th>
              <th className="px-4 py-2 font-medium">Price / cycle</th>
              <th className="px-4 py-2 font-medium">Per-month equiv.</th>
              <th className="px-4 py-2 font-medium">Subscribers</th>
              <th className="px-4 py-2 font-medium">Contribution to MRR</th>
              <th className="px-4 py-2 font-medium">Locked-in revenue</th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((p) => {
              const b = byPlan[p.id];
              const share = mrrCents > 0 ? Math.round((b.mrrCents / mrrCents) * 100) : 0;
              return (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="px-4 py-2.5 font-medium text-stone-800">{p.label}</td>
                  <td className="px-4 py-2.5 text-stone-700">{formatPrice(p.amountCents)} <span className="text-xs italic text-stone-400">/ {p.intervalCount === 1 ? p.interval : `${p.intervalCount} months`}</span></td>
                  <td className="px-4 py-2.5 text-stone-700">{formatPrice(p.monthlyEquivalentCents)}</td>
                  <td className="px-4 py-2.5 text-stone-800">{b.count}</td>
                  <td className="px-4 py-2.5 text-stone-800">
                    {formatPrice(b.mrrCents)}
                    {share > 0 && <span className="ml-2 text-xs italic text-stone-400">{share}%</span>}
                  </td>
                  <td className="px-4 py-2.5 text-stone-700">{formatPrice(b.revenuePerCycleCents)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-stone-50 border-t border-stone-200 font-medium">
              <td className="px-4 py-2.5 text-stone-700">Total</td>
              <td></td><td></td>
              <td className="px-4 py-2.5 text-stone-800">{active.length}</td>
              <td className="px-4 py-2.5 text-stone-800">{formatPrice(mrrCents)}</td>
              <td className="px-4 py-2.5 text-stone-800">{formatPrice(Object.values(byPlan).reduce((s, b) => s + b.revenuePerCycleCents, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Retention */}
      <section className="rounded-lg border border-stone-200 bg-white p-5 mb-6">
        <h2 className="font-display text-lg text-ink mb-3">Conversion & retention</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">All-time signups</div>
            <div className="font-display text-2xl text-forest-deep mt-1">{all.length}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Ever subscribed</div>
            <div className="font-display text-2xl text-forest-deep mt-1">{everSubbed}</div>
            <div className="text-[10px] italic text-stone-400">active + canceled</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Still active</div>
            <div className="font-display text-2xl text-emerald-700 mt-1">{active.length}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Retention rate</div>
            <div className="font-display text-2xl text-forest-deep mt-1">{retention != null ? `${retention}%` : "—"}</div>
            <div className="text-[10px] italic text-stone-400">active ÷ ever-subscribed</div>
          </div>
        </div>
      </section>

      {/* Per-customer paying list */}
      <section className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100">
          <h2 className="font-display text-lg text-ink">Paying customers</h2>
          <p className="text-xs italic text-stone-light">{active.length} active subscribers · who&apos;s paying, on which plan, until when.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-[10px] tracking-[0.18em] uppercase text-stone-500">
              <tr>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">/mo</th>
                <th className="px-4 py-2 font-medium">Cycle</th>
                <th className="px-4 py-2 font-medium">Started</th>
                <th className="px-4 py-2 font-medium">Renews</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center italic text-stone">No paying customers yet.</td></tr>
              ) : active.map((r) => {
                const cycleStart = r.periodStart ? new Date(r.periodStart) : null;
                const cycleEnd = r.periodEnd ? new Date(r.periodEnd) : null;
                const monthsHeld = cycleStart && cycleEnd
                  ? Math.max(1, Math.round((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24 * 30)))
                  : null;
                return (
                  <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50/60">
                    <td className="px-4 py-2.5 text-stone-800 whitespace-nowrap">
                      <div>{r.name || r.email}</div>
                      {r.name && <div className="text-[11px] text-stone-500">{r.email}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.plan?.label ?? "—"}</td>
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.plan ? formatPrice(r.plan.monthlyEquivalentCents) : "—"}</td>
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{monthsHeld ? `${monthsHeld}-month` : "—"}</td>
                    <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{cycleStart?.toLocaleDateString() ?? "—"}</td>
                    <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">
                      {cycleEnd?.toLocaleDateString() ?? "—"}
                      {r.cancelAtPeriodEnd && <span className="ml-2 text-[10px] italic text-rose-600">won&apos;t renew</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
