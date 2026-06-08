import { formatPrice } from "@/lib/stripe/plans";
import { getCustomerRows, daysFromNow } from "../_data";
import { requirePermission } from "../guard";
import { hasPermission } from "@/lib/admin/permissions";
import CustomerTable from "../_components/CustomerTable";
import StatCircle from "../_components/StatCircle";

export default async function AdminTrialPage() {
  const me = await requirePermission("trial");
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
  const canSeeMoney = hasPermission(me, "revenue");

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCircle label="On trial right now" value={String(rows.length)} tone="amber" />
        {canSeeMoney && (
          <StatCircle label="Pipeline" value={formatPrice(pipeline)} hint="if everyone converts" tone="forest" />
        )}
        <StatCircle label="Ending in ≤ 1 day" value={String(endingSoon)} tone="rose" />
      </div>

      <CustomerTable rows={rows} variant="trial" emptyMessage="No active trials right now." />
    </div>
  );
}
