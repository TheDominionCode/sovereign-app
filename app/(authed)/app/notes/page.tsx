import { ComingSoon } from "../_components/coming-soon";

export default function NotesPage() {
  return (
    <ComingSoon
      title="Notes"
      intent="Pinnable, taggable notes with full-text search."
      tables={["notes"]}
    />
  );
}
