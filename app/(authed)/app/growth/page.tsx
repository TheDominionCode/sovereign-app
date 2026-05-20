import { ComingSoon } from "../_components/coming-soon";

export default function GrowthPage() {
  return (
    <ComingSoon
      title="Growth & Self"
      intent="Strengths, weaknesses, what to improve, and custom self-reflection lists."
      tables={["reflection_lists", "reflection_items"]}
    />
  );
}
