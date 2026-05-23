import { formatPrice } from "@/lib/stripe/plans";
import { getCustomerRows, daysFromNow } from "../_data";
import CustomerTable from "../_components/CustomerTable";

export default async function AdminTrialPage() {
  const all = (await getCustomerRows()).filter((r) => r.status === "trialing");
  // Sort soonest-ending first — most urgent at the top.
  const rows = [...all].sort((a, b) => {
    const ax = a.trialEnd ?? "9999";
    const bx = b.trialEnd ?? "9999";
    return ax < bx ? -1 : ax > bx ? 1 : 0;
  });
  const pipeline = rows.reduce((s, r) => s + (r.plan?.amountCents ?? 0), 0);
  const endingSoon = rows.filter((r) => {
    const d = daysFromNow(r.trialEnd);
    return d != null && d <= 1;
  }).length;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">On trial right now</div>
          <div className="font-display text-2xl text-forest-deep mt-1">{rows.length}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Pipeline</div>
          <div className="font-display text-2xl text-forest-deep mt-1">{formatPrice(pipeline)}</div>
          <div className="text-[10px] italic text-stone-400 mt-0.5">if everyone converts at their selected plan</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Ending in ≤ 1 day</div>
          <div className="font-display text-2xl text-rose-600 mt-1">{endingSoon}</div>
        </div>
      </div>

      <CustomerTable rows={rows} variant="trial" emptyMessage="No active trials right now." />
    </div>
  );
}
