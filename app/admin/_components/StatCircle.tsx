// Reusable stat card — white rectangle with a small uppercase label + icon
// at the top, a big colored number in the middle, and an optional italic
// hint underneath. Matches the dashboard aesthetic of the inner app.

import type { ReactNode } from "react";

type Tone = "forest" | "emerald" | "amber" | "rose" | "stone" | "blue";

const NUMBER_COLOR: Record<Tone, string> = {
  forest:  "text-[#5b7351]",
  emerald: "text-emerald-700",
  amber:   "text-amber-600",
  rose:    "text-rose-600",
  stone:   "text-stone-600",
  blue:    "text-sky-700",
};

export default function StatCircle({
  label,
  value,
  hint,
  tone = "forest",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium">{label}</div>
        {icon && <div className="text-stone-400">{icon}</div>}
      </div>
      <div className={`font-display text-3xl leading-none ${NUMBER_COLOR[tone]}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {value}
      </div>
      {hint && <div className="text-xs italic text-stone-500 mt-2">{hint}</div>}
    </div>
  );
}
