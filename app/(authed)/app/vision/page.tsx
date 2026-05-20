import { ComingSoon } from "../_components/coming-soon";

export default function VisionPage() {
  return (
    <ComingSoon
      title="Vision Board"
      intent="A grid of cards with images, scripture captions, target dates, and a private letter-to-yourself per dream."
      tables={["vision_cards", "vision_meta"]}
    />
  );
}
