// Numbers inside colored circles — used on every admin sub-page so the
// design language is consistent with the overview tiles.

type Tone = "forest" | "emerald" | "amber" | "stone" | "rose";

const TONE: Record<Tone, string> = {
  forest:  "bg-gradient-to-br from-[#7a9a6e] to-[#3d5c34] text-white",
  emerald: "bg-gradient-to-br from-[#a8c090] to-[#5b7351] text-white",
  amber:   "bg-gradient-to-br from-amber-300 to-amber-600 text-white",
  stone:   "bg-gradient-to-br from-stone-300 to-stone-500 text-white",
  rose:    "bg-gradient-to-br from-rose-300 to-rose-500 text-white",
};

export default function StatCircle({
  label,
  value,
  hint,
  tone = "forest",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 flex flex-col items-center text-center">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-sm mb-3 ${TONE[tone]}`}>
        <span className="font-display text-2xl leading-none">{value}</span>
      </div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">{label}</div>
      {hint && <div className="text-[10px] italic text-stone-400 mt-1">{hint}</div>}
    </div>
  );
}
