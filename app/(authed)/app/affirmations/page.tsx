import { ComingSoon } from "../_components/coming-soon";

export default function AffirmationsPage() {
  return (
    <ComingSoon
      title="Affirmations"
      intent="Your library of affirmations, today's pick, favorites, and a morning-routine read-aloud flow."
      tables={["affirmations", "affirmation_picks"]}
    />
  );
}
