import { ComingSoon } from "../_components/coming-soon";

export default function BoundariesPage() {
  return (
    <ComingSoon
      title="Boundaries"
      intent="Expectations, deal breakers, non-negotiables — plus your own custom lists."
      tables={["boundary_lists", "boundary_items"]}
    />
  );
}
