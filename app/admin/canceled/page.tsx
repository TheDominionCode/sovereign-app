import { getCustomerRows } from "../_data";
import CustomerTable from "../_components/CustomerTable";

export default async function AdminCanceledPage() {
  const all = await getCustomerRows();
  // Show both: fully canceled subs + subs marked cancel-at-period-end.
  const rows = all.filter((r) => r.canceled || r.cancelAtPeriodEnd)
    .sort((a, b) => {
      const ax = a.canceledAt ?? a.periodEnd ?? "0";
      const bx = b.canceledAt ?? b.periodEnd ?? "0";
      return ax < bx ? 1 : -1;
    });
  const cancelingSoon = rows.filter((r) => r.cancelAtPeriodEnd && !r.canceled).length;
  const fullyCanceled = rows.filter((r) => r.canceled).length;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Fully canceled</div>
          <div className="font-display text-2xl text-stone-700 mt-1">{fullyCanceled}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Canceling at period end</div>
          <div className="font-display text-2xl text-rose-600 mt-1">{cancelingSoon}</div>
          <div className="text-[10px] italic text-stone-400 mt-0.5">still active, won't renew</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Total at risk</div>
          <div className="font-display text-2xl text-forest-deep mt-1">{rows.length}</div>
        </div>
      </div>

      <CustomerTable rows={rows} variant="canceled" emptyMessage="No cancellations yet — keep going." />
    </div>
  );
}
