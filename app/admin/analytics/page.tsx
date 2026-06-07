import { getRecentClicks } from "../_data";
import StatCircle from "../_components/StatCircle";
import AnalyticsCharts from "./AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Pull a wide window once on the server; the client component slices it
  // further by the 7/30/90-day filter so changing the filter is instant.
  const clicks = await getRecentClicks(90);

  const now = Date.now();
  const last24h = clicks.filter(
    (c) => new Date(c.clicked_at).getTime() >= now - 24 * 3_600_000,
  ).length;
  const last7d = clicks.filter(
    (c) => new Date(c.clicked_at).getTime() >= now - 7 * 86_400_000,
  ).length;
  const last30d = clicks.filter(
    (c) => new Date(c.clicked_at).getTime() >= now - 30 * 86_400_000,
  ).length;
  const total90d = clicks.length;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCircle label="Last 24 hours" value={last24h.toLocaleString()} tone="forest" />
        <StatCircle label="Last 7 days" value={last7d.toLocaleString()} tone="emerald" />
        <StatCircle label="Last 30 days" value={last30d.toLocaleString()} tone="forest" />
        <StatCircle label="Last 90 days" value={total90d.toLocaleString()} tone="stone" />
      </div>

      {clicks.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
          <div className="text-sm text-stone-600 mb-1">No visits tracked yet.</div>
          <div className="text-xs italic text-stone-400">
            Once the next deploy ships, every visit to the landing page will show up here.
          </div>
        </div>
      ) : (
        <AnalyticsCharts clicks={clicks} />
      )}
    </div>
  );
}
