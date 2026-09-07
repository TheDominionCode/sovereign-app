import { SECTIONS, type DailyResetRow } from "../_lib/types";

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };

const HEADINGS: Record<string, { en: string; es: string }> = {
  sovereign_reset:      { en: "The Sovereign Reset",       es: "El Reinicio Soberano" },
  today_principle:      { en: "Today's Principle",         es: "El Principio de Hoy" },
  scripture_reflection: { en: "Scripture + Reflection",    es: "Escritura y Reflexión" },
  brain_science:        { en: "Brain Science",              es: "Ciencia del Cerebro" },
  today_challenge:      { en: "Today's Challenge",          es: "El Reto de Hoy" },
  sovereign_thought:    { en: "Today's Sovereign Thought",  es: "El Pensamiento Soberano de Hoy" },
};

// Visual approximation of how this content renders inside CoachModule in
// public/os.html — kept in one place so the admin "Preview as User" route
// and the detail page's read-only summary look the same.
export default function DailyResetPreviewCard({ row, lang }: { row: DailyResetRow; lang: "en" | "es" }) {
  const dateLabel = new Date(row.date + "T00:00:00").toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto pb-12 px-4 pt-8">
      <div className="mb-8 text-center">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#7a9a6e] mb-2" style={serif}>{dateLabel}</p>
        <h1 className="font-serif text-3xl sm:text-4xl italic text-stone-800 leading-tight mb-2" style={serif}>
          {lang === "es" ? "Coach de IA" : "AI Coach"}
        </h1>
      </div>

      <div className="space-y-5">
        {SECTIONS.map((s) => {
          const html = row[`${s.key}_${lang}` as keyof DailyResetRow] as string | null;
          if (!html) return null;
          return (
            <div key={s.key} className="rounded-2xl border border-[#d3e0c5] bg-white px-6 py-6 shadow-sm">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#7a9a6e] font-semibold mb-3" style={serif}>
                {s.emoji} {HEADINGS[s.key][lang]}
              </p>
              <div
                className="text-sm text-stone-700 leading-loose italic [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                style={serif}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
