import { getRecentClicks } from "../_data";
import AnalyticsCharts from "./AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Pull a wide window once on the server; AnalyticsCharts slices it further
  // by the 7/30/90-day filter so changing the filter is instant. All of the
  // stat math (including "Today") now lives in the client component so it
  // uses the admin's browser-local midnight, not server UTC.
  const clicks = await getRecentClicks(90);

  // Render the full dashboard whether there's data or not — the admin should
  // be able to load the page on a quiet day and still see all the cards,
  // axes, and filters laid out. Empty days are visualized as 0-height bars.
  return <AnalyticsCharts clicks={clicks} />;
}
