import { formatPrice } from "@/lib/stripe/plans";
import { getCustomerRows } from "../_data";
import CustomerTable from "../_components/CustomerTable";

export default async function AdminActivePage() {
  const rows = (await getCustomerRows()).filter((r) => r.status === "active");
  const mrr = rows.reduce((s, r) => s + (r.plan?.monthlyEquivalentCents ?? 0), 0);
  const cancelingSoon = rows.filter((r) => r.cancelAtPeriodEnd).length;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Active subscribers</div>
          <div className="font-display text-2xl text-forest-deep mt-1">{rows.length}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Combined MRR</div>
          <div className="font-display text-2xl text-forest-deep mt-1">{formatPrice(mrr)}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Canceling at period end</div>
          <div className="font-display text-2xl text-rose-600 mt-1">{cancelingSoon}</div>
        </div>
      </div>

      <CustomerTable rows={rows} variant="active" emptyMessage="No active subscribers yet." />
    </div>
  );
}
