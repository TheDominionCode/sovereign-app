import { ComingSoon } from "../_components/coming-soon";

export default function CyclePage() {
  return (
    <ComingSoon
      title="Cycle & Mood"
      intent="Flow, mood, symptoms, and notes per day — plus daily vitamin doses."
      tables={["cycle_entries", "vitamins", "vitamin_doses"]}
    />
  );
}
