import { ComingSoon } from "../_components/coming-soon";

export default function CalendarPage() {
  return (
    <ComingSoon
      title="Calendar"
      intent="Full-year view with per-day events. Click any day to add what you need to do."
      tables={["calendar_events"]}
    />
  );
}
