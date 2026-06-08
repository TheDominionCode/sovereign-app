import { getCustomerRows } from "../_data";
import { requirePermission } from "../guard";
import CustomerTable from "../_components/CustomerTable";
import StatCircle from "../_components/StatCircle";

export default async function AdminCanceledPage() {
  await requirePermission("canceled");
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
        <StatCircle label="Fully canceled" value={String(fullyCanceled)} tone="stone" />
        <StatCircle label="Canceling at period end" value={String(cancelingSoon)} hint="still active, won't renew" tone="rose" />
        <StatCircle label="Total at risk" value={String(rows.length)} tone="forest" />
      </div>

      <CustomerTable rows={rows} variant="canceled" emptyMessage="No cancellations yet — keep going." />
    </div>
  );
}
