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
  const isLost = period === "lost";
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

  // "Lost early" = subscribers who chose the 1-month plan and canceled
  // before renewing. A simple proxy: canceled rows on the 1mo plan
  // (price_id matches the 1mo Stripe price) where the cycle ran ≤ ~31
  // days. These are people we never had a chance to retain — they paid
  // once and bounced. Shown alongside MRR as a negative beat.
  const oneMonthAndDone = canceled.filter((r) => {
    if (!r.plan || r.plan.id !== "1mo") return false;
    if (!r.periodStart || !r.periodEnd) return true; // unknown duration → still counts as 1mo
    const days =
      (new Date(r.periodEnd).getTime() - new Date(r.periodStart).getTime()) /
      (1000 * 60 * 60 * 24);
    return days <= 32;
  });
  const lostEarlyRevenueCents = oneMonthAndDone.reduce(
    (s, r) => s + (r.plan?.amountCents ?? 0),
    0
  );

  // % helpers for the conversion + retention section.
  const everSubbedAll = all.filter((r) => r.status === "active" || r.canceled).length;
  const trialConversionPct = trialing.length + active.length > 0
    ? Math.round((active.length / (active.length + trialing.length)) * 100)
    : null;
  const churnPct = everSubbedAll > 0
    ? Math.round((canceled.length / everSubbedAll) * 100)
    : null;
  const oneMonthChurnPct = active.length + oneMonthAndDone.length > 0
    ? Math.round((oneMonthAndDone.length / (active.length + oneMonthAndDone.length)) * 100)
    : null;

  // MTD revenue = sum of plan amounts for subs whose period started this
  // month. New starts + same-month renewals both count.
  const mtdRevenueCents = isMtd
    ? active.reduce((s, r) => s + (r.plan?.amountCents ?? 0), 0)
    : 0;

  return (
    <div>
      {/* View toggle: All time / Month to date / 1-month & done.
          Each pill swaps the page into a different lens — All time is the
          headline view, Month to date scopes to this month, and 1-month
          & done flips into the "lost early" view (no MRR tiles, just the
          customers who paid once and didn't renew). */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Link
          href="/admin/revenue"
          className={`px-3 py-1.5 text-xs rounded-full border transition ${
            !isMtd && !isLost
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
        <Link
          href="/admin/revenue?period=lost"
          className={`px-3 py-1.5 text-xs rounded-full border transition ${
            isLost
              ? "bg-rose-600 text-white border-rose-600"
              : "border-stone-200 text-stone-600 hover:border-rose-500 hover:text-rose-600"
          }`}
        >
          1-month &amp; done
        </Link>
        {isMtd && (
          <span className="ml-2 text-[11px] italic text-stone-500">
            since {new Date(monthStart).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
          </span>
        )}
        {isLost && (
          <span className="ml-2 text-[11px] italic text-rose-500">
            subscribers who paid once and didn&apos;t renew
          </span>
        )}
      </div>

      {/* "1-month & done" lens — clean white cards with rose text only.
          No filled red boxes; the negative number itself does the work. */}
      {isLost && (
        <>
          <div className="rounded-lg p-5 border border-stone-200 bg-white mb-3">
            <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold">1-month &amp; done</div>
            <div className="font-display text-4xl mt-1 text-rose-700">−{oneMonthAndDone.length}</div>
            <div className="text-[11px] italic mt-1 text-stone-500">
              subscribers who picked the monthly plan, paid once, and canceled before renewing
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg p-5 border border-stone-200 bg-white">
              <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold">Revenue earned</div>
              <div className="font-display text-3xl mt-1 text-rose-700">{formatPrice(lostEarlyRevenueCents)}</div>
              <div className="text-[11px] italic text-stone-400 mt-1">we earned, they left</div>
            </div>
            <div className="rounded-lg p-5 border border-stone-200 bg-white">
              <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold">Of 1-month base</div>
              <div className="font-display text-3xl mt-1 text-rose-700">
                {oneMonthChurnPct != null ? `${oneMonthChurnPct}%` : "—"}
              </div>
              <div className="text-[11px] italic text-stone-400 mt-1">churned at month one</div>
            </div>
            <div className="rounded-lg p-5 border border-stone-200 bg-white">
              <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold">Avg revenue lost</div>
              <div className="font-display text-3xl mt-1 text-rose-700">
                {oneMonthAndDone.length > 0 ? formatPrice(Math.round(lostEarlyRevenueCents / oneMonthAndDone.length)) : "—"}
              </div>
              <div className="text-[11px] italic text-stone-400 mt-1">per person, before they left</div>
            </div>
          </div>

          <section className="rounded-lg border border-stone-200 bg-white overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-stone-100">
              <h2 className="font-display text-lg text-ink">Who left after one month</h2>
              <p className="text-xs italic text-stone-light">
                {oneMonthAndDone.length} {oneMonthAndDone.length === 1 ? "person" : "people"} — reach out, ask what changed, learn what to fix.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-[10px] tracking-[0.18em] uppercase text-stone-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Customer</th>
                    <th className="px-4 py-2 font-medium">Plan</th>
                    <th className="px-4 py-2 font-medium">Started</th>
                    <th className="px-4 py-2 font-medium">Canceled</th>
                    <th className="px-4 py-2 font-medium">Revenue earned</th>
                  </tr>
                </thead>
                <tbody>
                  {oneMonthAndDone.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center italic text-stone-light">
                      No one churned after one month yet — keep it that way.
                    </td></tr>
                  ) : oneMonthAndDone.map((r) => {
                    const startedAt = r.periodStart ? new Date(r.periodStart) : null;
                    const canceledAt = r.canceledAt ? new Date(r.canceledAt) : null;
                    return (
                      <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50">
                        <td className="px-4 py-2.5 text-stone-800 whitespace-nowrap">
                          <div>{r.name || r.email}</div>
                          {r.name && <div className="text-[11px] text-stone-500">{r.email}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.plan?.label ?? "—"}</td>
                        <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{startedAt?.toLocaleDateString() ?? "—"}</td>
                        <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{canceledAt?.toLocaleDateString() ?? "—"}</td>
                        <td className="px-4 py-2.5 text-rose-700 whitespace-nowrap font-medium">
                          −{r.plan ? formatPrice(r.plan.amountCents) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

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

      {/* Top headline stats — MRR · ARPU · TRIAL PIPELINE · ARR.
          Hidden when the Lost lens is active so that view stays focused. */}
      {!isLost && (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div className="rounded-lg p-5" style={{ background: "#3d5c34", color: "#f1ebda" }}>
          <div className="text-[10px] tracking-[0.18em] uppercase">MRR</div>
          <div className="font-display text-3xl mt-1">{formatPrice(mrrCents)}</div>
          <div className="text-[11px] italic mt-1 opacity-80">monthly recurring</div>
        </div>
        <div className="rounded-lg p-5 border border-stone-200 bg-white">
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500">ARPU</div>
          <div className="font-display text-3xl text-forest-deep mt-1">{formatPrice(arpuCents)}</div>
          <div className="text-[11px] italic text-stone-400 mt-1">avg revenue / active user / mo</div>
        </div>
        <div className="rounded-lg p-5 border border-stone-200 bg-white">
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500">Trial pipeline</div>
          <div className="font-display text-3xl text-forest-deep mt-1">{formatPrice(trialPipelineCents)}</div>
          <div className="text-[11px] italic text-stone-400 mt-1">if everyone converts · {trialing.length} on trial</div>
        </div>
        <div className="rounded-lg p-5" style={{ background: "#3d5c34", color: "#f1ebda" }}>
          <div className="text-[10px] tracking-[0.18em] uppercase">ARR</div>
          <div className="font-display text-3xl mt-1">{formatPrice(arrCents)}</div>
          <div className="text-[11px] italic mt-1 opacity-80">annualized run rate</div>
        </div>
      </div>

      {/* Compact "1-month & done" callout right under the headline tiles.
          Acts as a teaser into the dedicated lens — tap to drill in. */}
      {oneMonthAndDone.length > 0 && (
        <Link href="/admin/revenue?period=lost" className="block mb-6 rounded-lg border border-rose-200 bg-rose-50/40 px-4 py-3 text-xs italic text-rose-900 hover:bg-rose-50 transition">
          <span className="font-medium not-italic">1-month &amp; done:</span>{" "}
          <span className="font-medium not-italic">−{oneMonthAndDone.length}</span>
          {" "}left after one paid month
          {lostEarlyRevenueCents > 0 && <> ({formatPrice(lostEarlyRevenueCents)} earned)</>}
          {" "}— tap to see who.
        </Link>
      )}
      </>
      )}

      {!isLost && (
      <>
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
              <th className="px-4 py-2 font-medium">% of base</th>
              <th className="px-4 py-2 font-medium">Contribution to MRR</th>
              <th className="px-4 py-2 font-medium">Locked-in revenue</th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((p) => {
              const b = byPlan[p.id];
              const share = mrrCents > 0 ? Math.round((b.mrrCents / mrrCents) * 100) : 0;
              const customerShare = active.length > 0 ? Math.round((b.count / active.length) * 100) : 0;
              return (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="px-4 py-2.5 font-medium text-stone-800">{p.label}</td>
                  <td className="px-4 py-2.5 text-stone-700">{formatPrice(p.amountCents)} <span className="text-xs italic text-stone-400">/ {p.intervalCount === 1 ? p.interval : `${p.intervalCount} months`}</span></td>
                  <td className="px-4 py-2.5 text-stone-700">{formatPrice(p.monthlyEquivalentCents)}</td>
                  <td className="px-4 py-2.5 text-stone-800">{b.count}</td>
                  <td className="px-4 py-2.5 text-stone-700">
                    {b.count > 0 ? <span className="font-medium">{customerShare}%</span> : <span className="text-stone-400">—</span>}
                  </td>
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
              <td className="px-4 py-2.5 text-stone-800">100%</td>
              <td className="px-4 py-2.5 text-stone-800">{formatPrice(mrrCents)}</td>
              <td className="px-4 py-2.5 text-stone-800">{formatPrice(Object.values(byPlan).reduce((s, b) => s + b.revenuePerCycleCents, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Retention */}
      <section className="rounded-lg border border-stone-200 bg-white p-5 mb-6">
        <h2 className="font-display text-lg text-ink mb-3">Conversion &amp; retention</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Still paying</div>
            <div className="font-display text-2xl text-emerald-700 mt-1">{active.length}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Trial → paying</div>
            <div className="font-display text-2xl text-emerald-700 mt-1">{trialConversionPct != null ? `${trialConversionPct}%` : "—"}</div>
            <div className="text-[10px] italic text-stone-400">of trial + paying</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Retention</div>
            <div className="font-display text-2xl text-forest-deep mt-1">{retention != null ? `${retention}%` : "—"}</div>
            <div className="text-[10px] italic text-stone-400">paying ÷ ever-subscribed</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Churn</div>
            <div className="font-display text-2xl text-rose-700 mt-1">{churnPct != null ? `${churnPct}%` : "—"}</div>
            <div className="text-[10px] italic text-stone-400">canceled ÷ ever-subscribed</div>
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
      </>
      )}
    </div>
  );
}
