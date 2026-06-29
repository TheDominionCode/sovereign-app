import { formatPrice, PLANS } from "@/lib/stripe/plans";
import { getCustomerRows } from "../_data";
import { requirePermission } from "../guard";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import RevenueFilters from "./RevenueFilters";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ period?: string; from?: string; to?: string }>;

// Stripe standard US card rate: 2.9% + $0.30 per successful transaction.
function estimateFee(grossCents: number): number {
  return Math.round(grossCents * 0.029 + 30);
}

function startOfThisMonthIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// Query Stripe for paid invoices in a date range.
// Paginates up to 2000 invoices. Fees are estimated at 2.9% + $0.30 per
// invoice (standard US card rate) — accurate without needing balance_transaction lookups.
async function getStripeRevenue(fromUnix?: number, toUnix?: number) {
  try {
    const created: { gte?: number; lte?: number } = {};
    if (fromUnix) created.gte = fromUnix;
    if (toUnix)   created.lte = toUnix;

    const invoices: { amount_paid: number; id: string }[] = [];
    let starting_after: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const page = await stripe.invoices.list({
        status: "paid",
        limit: 100,
        ...(Object.keys(created).length ? { created } : {}),
        ...(starting_after ? { starting_after } : {}),
      });
      invoices.push(...page.data.map((inv) => ({ amount_paid: inv.amount_paid ?? 0, id: inv.id })));
      hasMore = page.has_more;
      if (page.data.length) starting_after = page.data[page.data.length - 1].id;
      else break;
      if (invoices.length >= 2000) break;
    }

    // Exclude $0 trial / promo invoices
    const paid = invoices.filter((inv) => inv.amount_paid > 0);
    const grossCents = paid.reduce((s, inv) => s + inv.amount_paid, 0);
    const feeCents   = paid.reduce((s, inv) => s + estimateFee(inv.amount_paid), 0);
    return { grossCents, feeCents, netCents: grossCents - feeCents, txCount: paid.length };
  } catch {
    return { grossCents: 0, feeCents: 0, netCents: 0, txCount: 0 };
  }
}

// Approved community members = Sovereign's affiliates.
// Commission tracking requires a referral-code system (not yet built).
async function getApprovedAffiliates() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("affiliate_applications")
    .select("id,email,decided_at,decided_by")
    .eq("status", "approved")
    .order("decided_at", { ascending: false });
  return (data ?? []) as { id: number; email: string; decided_at: string | null; decided_by: string | null }[];
}

export default async function AdminRevenuePage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission("revenue");
  const { period, from, to } = await searchParams;

  const isMtd    = period === "mtd";
  const isLost   = period === "lost";
  const isCustom = period === "custom" && (!!from || !!to);

  const monthStart = startOfThisMonthIso();

  // Stripe invoice query date bounds
  let fromUnix: number | undefined;
  let toUnix:   number | undefined;
  if (isMtd) {
    fromUnix = Math.floor(new Date(monthStart).getTime() / 1000);
  } else if (isCustom) {
    if (from) fromUnix = Math.floor(new Date(from).getTime() / 1000);
    if (to)   toUnix   = Math.floor(new Date(to + "T23:59:59").getTime() / 1000);
  }
  // All time → no bounds

  const [all, stripeRevenue, affiliates] = await Promise.all([
    getCustomerRows(),
    getStripeRevenue(fromUnix, toUnix),
    getApprovedAffiliates(),
  ]);

  const activeAll  = all.filter((r) => r.status === "active");
  const active     = isMtd
    ? activeAll.filter((r) => r.periodStart && r.periodStart >= monthStart)
    : activeAll;
  const trialing   = all.filter((r) => r.status === "trialing");
  const canceled   = all.filter((r) => r.canceled);

  // MRR + ARR = current run rate (always from all active, not date-scoped)
  const mrrCents           = activeAll.reduce((s, r) => s + (r.plan?.monthlyEquivalentCents ?? 0), 0);
  const arrCents           = mrrCents * 12;
  const trialPipelineCents = trialing.reduce((s, r) => s + (r.plan?.amountCents ?? 0), 0);
  const arpuCents          = activeAll.length > 0 ? Math.round(mrrCents / activeAll.length) : 0;

  // Per-plan breakdown (scoped to active / MTD-active)
  const byPlan: Record<string, { count: number; mrrCents: number; revenuePerCycleCents: number }> = {};
  for (const p of PLANS) byPlan[p.id] = { count: 0, mrrCents: 0, revenuePerCycleCents: 0 };
  for (const r of active) {
    if (!r.plan) continue;
    const b = byPlan[r.plan.id];
    if (b) { b.count += 1; b.mrrCents += r.plan.monthlyEquivalentCents; b.revenuePerCycleCents += r.plan.amountCents; }
  }

  // Retention + churn
  const everSubbed         = activeAll.length + canceled.length;
  const retention          = everSubbed > 0 ? Math.round((activeAll.length / everSubbed) * 100) : null;
  const everSubbedAll      = all.filter((r) => r.status === "active" || r.canceled).length;
  const trialConversionPct = trialing.length + activeAll.length > 0
    ? Math.round((activeAll.length / (activeAll.length + trialing.length)) * 100)
    : null;
  const churnPct           = everSubbedAll > 0 ? Math.round((canceled.length / everSubbedAll) * 100) : null;

  // 1-month & done
  const oneMonthAndDone    = canceled.filter((r) => {
    if (!r.plan || r.plan.id !== "1mo") return false;
    if (!r.periodStart || !r.periodEnd) return true;
    const days = (new Date(r.periodEnd).getTime() - new Date(r.periodStart).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 32;
  });
  const lostEarlyRevenueCents  = oneMonthAndDone.reduce((s, r) => s + (r.plan?.amountCents ?? 0), 0);
  const oneMonthChurnPct       = activeAll.length + oneMonthAndDone.length > 0
    ? Math.round((oneMonthAndDone.length / (activeAll.length + oneMonthAndDone.length)) * 100)
    : null;

  // Human-readable scope label for the collected tiles
  const scopeLabel = isMtd
    ? `since ${new Date(monthStart).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`
    : isCustom
    ? [from && `from ${new Date(from).toLocaleDateString()}`, to && `to ${new Date(to).toLocaleDateString()}`].filter(Boolean).join(" ")
    : "all time";

  return (
    <div>
      <RevenueFilters period={period ?? "all"} from={from} to={to} />

      {/* ── 1-MONTH & DONE ── */}
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
              <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold">Gross earned</div>
              <div className="font-display text-3xl mt-1 text-rose-700">{formatPrice(lostEarlyRevenueCents)}</div>
              <div className="text-[11px] italic text-stone-400 mt-1">before Stripe fees</div>
            </div>
            <div className="rounded-lg p-5 border border-stone-200 bg-white">
              <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold">Net to you</div>
              <div className="font-display text-3xl mt-1 text-rose-700">
                {formatPrice(lostEarlyRevenueCents - oneMonthAndDone.reduce((s, r) => s + estimateFee(r.plan?.amountCents ?? 0), 0))}
              </div>
              <div className="text-[11px] italic text-stone-400 mt-1">after 2.9% + $0.30 per tx</div>
            </div>
            <div className="rounded-lg p-5 border border-stone-200 bg-white">
              <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold">Of 1-month base</div>
              <div className="font-display text-3xl mt-1 text-rose-700">
                {oneMonthChurnPct != null ? `${oneMonthChurnPct}%` : "—"}
              </div>
              <div className="text-[11px] italic text-stone-400 mt-1">churned at month one</div>
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
                    <th className="px-4 py-2 font-medium">Gross</th>
                    <th className="px-4 py-2 font-medium">Net to you</th>
                  </tr>
                </thead>
                <tbody>
                  {oneMonthAndDone.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center italic text-stone-light">No one churned after one month yet — keep it that way.</td></tr>
                  ) : oneMonthAndDone.map((r) => {
                    const gross = r.plan?.amountCents ?? 0;
                    const fee   = estimateFee(gross);
                    return (
                      <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50">
                        <td className="px-4 py-2.5 text-stone-800 whitespace-nowrap">
                          <div>{r.name || r.email}</div>
                          {r.name && <div className="text-[11px] text-stone-500">{r.email}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.plan?.label ?? "—"}</td>
                        <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">
                          {r.periodStart ? new Date(r.periodStart).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">
                          {r.canceledAt ? new Date(r.canceledAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-rose-700 whitespace-nowrap font-medium">{formatPrice(gross)}</td>
                        <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{formatPrice(gross - fee)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ── MAIN VIEW (all time / MTD / custom) ── */}
      {!isLost && (
        <>
          {/* Collected summary — true numbers from Stripe invoices */}
          <div className="mb-3">
            <div className="text-[10px] tracking-[0.18em] uppercase text-stone-400 mb-2 font-semibold">
              Collected · {scopeLabel}
              {stripeRevenue.txCount > 0 && (
                <span className="normal-case font-normal italic ml-2 text-stone-400">
                  ({stripeRevenue.txCount} transactions · fees est. 2.9% + $0.30 each)
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg p-5" style={{ background: "#3d5c34", color: "#f1ebda" }}>
                <div className="text-[10px] tracking-[0.18em] uppercase opacity-80">Gross collected</div>
                <div className="font-display text-4xl mt-1">{formatPrice(stripeRevenue.grossCents)}</div>
                <div className="text-[11px] italic mt-1 opacity-70">before Stripe fees</div>
              </div>
              <div className="rounded-lg p-5 border border-rose-200 bg-white">
                <div className="text-[10px] tracking-[0.18em] uppercase text-rose-700">Stripe fees paid</div>
                <div className="font-display text-4xl mt-1 text-rose-800">−{formatPrice(stripeRevenue.feeCents)}</div>
                <div className="text-[11px] italic mt-1 text-rose-400">2.9% + $0.30 per charge</div>
              </div>
              <div className="rounded-lg p-5 border border-emerald-200 bg-white">
                <div className="text-[10px] tracking-[0.18em] uppercase text-emerald-800">Net to you</div>
                <div className="font-display text-4xl mt-1 text-emerald-900">{formatPrice(stripeRevenue.netCents)}</div>
                <div className="text-[11px] italic mt-1 text-emerald-600">what you actually keep</div>
              </div>
            </div>
          </div>

          {/* ARR — its own featured section */}
          <div className="mb-3">
            <div className="text-[10px] tracking-[0.18em] uppercase text-stone-400 mb-2 font-semibold">
              Annual run rate · current active subscribers
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg p-5 col-span-2" style={{ background: "#2d4326", color: "#f1ebda" }}>
                <div className="text-[10px] tracking-[0.18em] uppercase opacity-80">ARR</div>
                <div className="font-display text-5xl mt-1">{formatPrice(arrCents)}</div>
                <div className="text-[11px] italic mt-1 opacity-70">
                  {activeAll.length} paying subs × monthly-equiv × 12
                </div>
              </div>
              <div className="rounded-lg p-5" style={{ background: "#3d5c34", color: "#f1ebda" }}>
                <div className="text-[10px] tracking-[0.18em] uppercase opacity-80">MRR</div>
                <div className="font-display text-3xl mt-1">{formatPrice(mrrCents)}</div>
                <div className="text-[11px] italic mt-1 opacity-70">monthly recurring</div>
              </div>
              <div className="rounded-lg p-5 border border-stone-200 bg-white">
                <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500">ARPU</div>
                <div className="font-display text-3xl text-forest-deep mt-1">{formatPrice(arpuCents)}</div>
                <div className="text-[11px] italic text-stone-400 mt-1">avg / active user / mo</div>
              </div>
            </div>
          </div>

          {/* Trial pipeline */}
          {trialPipelineCents > 0 && (
            <div className="rounded-lg p-4 border border-stone-200 bg-white mb-3 flex items-baseline gap-4">
              <div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500">Trial pipeline</div>
                <div className="font-display text-2xl text-forest-deep mt-0.5">{formatPrice(trialPipelineCents)}</div>
              </div>
              <div className="text-xs italic text-stone-400">if all {trialing.length} trialing convert · gross before fees</div>
            </div>
          )}

          {/* 1-mo & done teaser */}
          {oneMonthAndDone.length > 0 && (
            <a href="/admin/revenue?period=lost" className="block mb-5 rounded-lg border border-rose-200 bg-rose-50/40 px-4 py-3 text-xs italic text-rose-900 hover:bg-rose-50 transition">
              <span className="font-medium not-italic">1-month &amp; done:</span>{" "}
              <span className="font-medium not-italic">−{oneMonthAndDone.length}</span>{" "}
              left after one paid month{lostEarlyRevenueCents > 0 && <> ({formatPrice(lostEarlyRevenueCents)} gross)</>} — tap to see who.
            </a>
          )}

          {/* Revenue by plan */}
          <section className="rounded-lg border border-stone-200 bg-white overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-stone-100">
              <h2 className="font-display text-lg text-ink">Revenue by plan</h2>
              <p className="text-xs italic text-stone-light">Active subscribers only · current billing cycle.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-[10px] tracking-[0.18em] uppercase text-stone-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Plan</th>
                    <th className="px-4 py-2 font-medium">Price / cycle</th>
                    <th className="px-4 py-2 font-medium">Net per sale</th>
                    <th className="px-4 py-2 font-medium">Subscribers</th>
                    <th className="px-4 py-2 font-medium">% of base</th>
                    <th className="px-4 py-2 font-medium">MRR equiv.</th>
                    <th className="px-4 py-2 font-medium">Locked-in gross</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map((p) => {
                    const b = byPlan[p.id];
                    const netPerSale     = p.amountCents - estimateFee(p.amountCents);
                    const share          = mrrCents > 0 ? Math.round((b.mrrCents / mrrCents) * 100) : 0;
                    const customerShare  = active.length > 0 ? Math.round((b.count / active.length) * 100) : 0;
                    return (
                      <tr key={p.id} className="border-t border-stone-100">
                        <td className="px-4 py-2.5 font-medium text-stone-800">{p.label}</td>
                        <td className="px-4 py-2.5 text-stone-700">
                          {formatPrice(p.amountCents)}
                          <span className="text-xs italic text-stone-400 ml-1">
                            / {p.intervalCount === 1 ? p.interval : `${p.intervalCount} months`}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-emerald-700 font-medium">{formatPrice(netPerSale)}</td>
                        <td className="px-4 py-2.5 text-stone-800">{b.count}</td>
                        <td className="px-4 py-2.5 text-stone-700">
                          {b.count > 0
                            ? <span className="font-medium">{customerShare}%</span>
                            : <span className="text-stone-400">—</span>}
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
                    <td className="px-4 py-2.5 text-stone-800">
                      {formatPrice(Object.values(byPlan).reduce((s, b) => s + b.revenuePerCycleCents, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Affiliates */}
          <section className="rounded-lg border border-stone-200 bg-white overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-stone-100">
              <h2 className="font-display text-lg text-ink">Affiliates</h2>
              <p className="text-xs italic text-stone-light">
                {affiliates.length} approved · commission tracking requires referral codes (not yet built — contact me to set up).
              </p>
            </div>
            {affiliates.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm italic text-stone-400">No affiliates approved yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 text-left text-[10px] tracking-[0.18em] uppercase text-stone-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Email</th>
                      <th className="px-4 py-2 font-medium">Approved</th>
                      <th className="px-4 py-2 font-medium">By</th>
                      <th className="px-4 py-2 font-medium text-stone-400">Commission earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map((a) => (
                      <tr key={a.id} className="border-t border-stone-100 hover:bg-stone-50">
                        <td className="px-4 py-2.5 text-stone-800">{a.email}</td>
                        <td className="px-4 py-2.5 text-stone-600 text-xs">
                          {a.decided_at ? new Date(a.decided_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-stone-500 text-xs">{a.decided_by ?? "—"}</td>
                        <td className="px-4 py-2.5 text-stone-400 text-xs italic">referral tracking needed</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                <div className="font-display text-2xl text-emerald-700 mt-1">{activeAll.length}</div>
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

          {/* Paying customers */}
          <section className="rounded-lg border border-stone-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100">
              <h2 className="font-display text-lg text-ink">Paying customers</h2>
              <p className="text-xs italic text-stone-light">
                {activeAll.length} active · gross per cycle · net after Stripe fees shown per customer.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-[10px] tracking-[0.18em] uppercase text-stone-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Customer</th>
                    <th className="px-4 py-2 font-medium">Plan</th>
                    <th className="px-4 py-2 font-medium">Gross / cycle</th>
                    <th className="px-4 py-2 font-medium">Net to you</th>
                    <th className="px-4 py-2 font-medium">Started</th>
                    <th className="px-4 py-2 font-medium">Renews</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAll.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center italic text-stone">No paying customers yet.</td></tr>
                  ) : activeAll.map((r) => {
                    const gross = r.plan?.amountCents ?? 0;
                    const net   = gross > 0 ? gross - estimateFee(gross) : 0;
                    const cycleStart = r.periodStart ? new Date(r.periodStart) : null;
                    const cycleEnd   = r.periodEnd   ? new Date(r.periodEnd)   : null;
                    return (
                      <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50/60">
                        <td className="px-4 py-2.5 text-stone-800 whitespace-nowrap">
                          <div>{r.name || r.email}</div>
                          {r.name && <div className="text-[11px] text-stone-500">{r.email}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.plan?.label ?? "—"}</td>
                        <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{gross > 0 ? formatPrice(gross) : "—"}</td>
                        <td className="px-4 py-2.5 text-emerald-700 font-medium whitespace-nowrap">{net > 0 ? formatPrice(net) : "—"}</td>
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
