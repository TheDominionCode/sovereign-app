import { formatPrice } from "@/lib/stripe/plans";
import { getCustomerRows } from "../_data";
import { requirePermission } from "../guard";
import { hasPermission } from "@/lib/admin/permissions";
import CustomerTable from "../_components/CustomerTable";
import StatCircle from "../_components/StatCircle";

export default async function AdminActivePage() {
  const me = await requirePermission("active");
  const rows = (await getCustomerRows()).filter((r) => r.status === "active");
  const mrr = rows.reduce((s, r) => s + (r.plan?.monthlyEquivalentCents ?? 0), 0);
  const cancelingSoon = rows.filter((r) => r.cancelAtPeriodEnd).length;
  // MRR tile is gated on the separate 'revenue' permission.
  const canSeeMoney = hasPermission(me, "revenue");

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCircle label="Active subscribers" value={String(rows.length)} tone="emerald" />
        {canSeeMoney && (
          <StatCircle label="Combined MRR" value={formatPrice(mrr)} tone="forest" />
        )}
        <StatCircle label="Canceling at period end" value={String(cancelingSoon)} tone="rose" />
      </div>

      <CustomerTable rows={rows} variant="active" emptyMessage="No active subscribers yet." />
    </div>
  );
}
