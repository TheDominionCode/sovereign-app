import { getRecentClicks, getRecentConversions } from "../_data";
import { requirePermission } from "../guard";
import AnalyticsCharts from "./AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requirePermission("analytics");
  // Pull a wide window once on the server; AnalyticsCharts slices it further
  // by the 7/30/90-day filter so changing the filter is instant. All of the
  // stat math (including "Today") now lives in the client component so it
  // uses the admin's browser-local midnight, not server UTC.
  //
  // Conversions are fetched separately because they live across auth.users
  // and subscriptions, not in the clicks table — the client component joins
  // them in the browser to render visit→signup→paid rate.
  const [clicks, conversions] = await Promise.all([
    getRecentClicks(90),
    getRecentConversions(90),
  ]);

  // Render the full dashboard whether there's data or not — the admin should
  // be able to load the page on a quiet day and still see all the cards,
  // axes, and filters laid out. Empty days are visualized as 0-height bars.
  return <AnalyticsCharts clicks={clicks} conversions={conversions} />;
}
