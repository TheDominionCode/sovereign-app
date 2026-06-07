import { getRecentClicks } from "../_data";
import AnalyticsCharts from "./AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Pull a wide window once on the server; AnalyticsCharts slices it further
  // by the 7/30/90-day filter so changing the filter is instant. All of the
  // stat math (including "Today") now lives in the client component so it
  // uses the admin's browser-local midnight, not server UTC.
  const clicks = await getRecentClicks(90);

  if (clicks.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
        <div className="text-sm text-stone-600 mb-1">No visits tracked yet.</div>
        <div className="text-xs italic text-stone-400">
          Once the next deploy ships, every visit to the landing page will show up here.
        </div>
      </div>
    );
  }
  return <AnalyticsCharts clicks={clicks} />;
}
