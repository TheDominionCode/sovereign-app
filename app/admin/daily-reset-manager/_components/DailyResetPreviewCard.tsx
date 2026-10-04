import type { DailyResetRow } from "../_lib/types";

// Cormorant Garamond regular is the default editorial font (spec §28) —
// italic is reserved for the scripture quote and the closing Sovereign
// Thought only, not applied blanket across every paragraph.
const display = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const COPY = {
  en: {
    todaysPrinciple: "Today's Principle", scripture: "Scripture + Reflection", brainScience: "Brain Science",
    metacognition: "Metacognition", challenge: "Today's Challenge", thought: "Today's Sovereign Thought",
    alignment: "Today's Alignment", wordOfDay: "Word of the Day", daysLeft: (n: number) => `${n} days left in the year.`,
  },
  es: {
    todaysPrinciple: "El Principio de Hoy", scripture: "Escritura y Reflexión", brainScience: "Ciencia del Cerebro",
    metacognition: "Metacognición", challenge: "El Reto de Hoy", thought: "El Pensamiento Soberano de Hoy",
    alignment: "La Alineación de Hoy", wordOfDay: "Palabra del Día", daysLeft: (n: number) => `Quedan ${n} días en el año.`,
  },
};

function Card({ emoji, label, children }: { emoji: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#d3e0c5] bg-white px-6 py-6 shadow-sm">
      <p className="text-[9px] tracking-[0.3em] uppercase text-[#7a9a6e] font-semibold mb-3" style={display}>{emoji} {label}</p>
      {children}
    </div>
  );
}

const bodyClass = "text-sm text-stone-700 leading-loose [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5";

// Visual approximation of how this content renders inside CoachModule in
// public/os.html — kept in one place so the admin "Preview as User" route
// and the detail page's read-only summary look the same.
export default function DailyResetPreviewCard({ row, lang }: { row: DailyResetRow; lang: "en" | "es" }) {
  const t = COPY[lang];
  const dateLabel = new Date(row.date + "T00:00:00").toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const title = lang === "es" ? row.title_es : row.title_en;
  const sovereignReset = lang === "es" ? row.sovereign_reset_es : row.sovereign_reset_en;
  const todayPrinciple = lang === "es" ? row.today_principle_es : row.today_principle_en;
  const scriptureText = lang === "es" ? row.scripture_text_es : row.scripture_text_en;
  const scriptureReflection = lang === "es" ? row.scripture_reflection_es : row.scripture_reflection_en;
  const brainScience = lang === "es" ? row.brain_science_es : row.brain_science_en;
  const metacognition = lang === "es" ? row.metacognition_prompt_es : row.metacognition_prompt_en;
  const challenge = lang === "es" ? row.today_challenge_es : row.today_challenge_en;
  const thought = lang === "es" ? row.sovereign_thought_es : row.sovereign_thought_en;
  const alignment = lang === "es" ? row.alignment_prompt_es : row.alignment_prompt_en;
  const wordOfDay = lang === "es" ? row.word_of_day_es : row.word_of_day_en;
  const wordDefinition = lang === "es" ? row.word_definition_es : row.word_definition_en;

  return (
    <div className="max-w-2xl mx-auto pb-12 px-4 pt-8">
      <div className="mb-8 text-center">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#7a9a6e] mb-2" style={display}>{dateLabel}</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-stone-800 leading-tight mb-1" style={display}>
          {row.day_number ? `Day ${row.day_number}` : (lang === "es" ? "Coach de IA" : "AI Coach")}{title ? ` — ${title}` : ""}
        </h1>
        {row.days_remaining != null && <p className="text-xs italic text-stone-400" style={display}>{t.daysLeft(row.days_remaining)}</p>}
      </div>

      <div className="space-y-5">
        {wordOfDay && (
          <div className="rounded-full border border-[#d3e0c5] bg-[#f4f7ee] px-5 py-2 text-center text-sm text-[#5b7351] inline-block mx-auto" style={display}>
            <strong>{t.wordOfDay}:</strong> {wordOfDay}{wordDefinition ? ` — ${wordDefinition}` : ""}
          </div>
        )}

        {sovereignReset && (
          <Card emoji="🌿" label="The Sovereign Reset">
            <div className={bodyClass} style={display} dangerouslySetInnerHTML={{ __html: sovereignReset }} />
          </Card>
        )}

        {todayPrinciple && (
          <Card emoji="🧠" label={t.todaysPrinciple}>
            <div className={bodyClass} style={display} dangerouslySetInnerHTML={{ __html: todayPrinciple }} />
          </Card>
        )}

        {(scriptureText || scriptureReflection) && (
          <Card emoji="📖" label={t.scripture}>
            {scriptureText && (
              <p className="text-sm italic text-stone-800 mb-3 leading-relaxed" style={display}>
                “{scriptureText}” — {row.scripture_reference}{row.scripture_translation ? ` (${row.scripture_translation})` : ""}
              </p>
            )}
            {scriptureReflection && <div className={bodyClass} style={display} dangerouslySetInnerHTML={{ __html: scriptureReflection }} />}
          </Card>
        )}

        {brainScience && (
          <Card emoji="🧠" label={t.brainScience}>
            <div className={bodyClass} style={display} dangerouslySetInnerHTML={{ __html: brainScience }} />
          </Card>
        )}

        {metacognition && (
          <Card emoji="🪞" label={t.metacognition}>
            <p className="text-sm text-stone-700 leading-relaxed" style={display}>{metacognition}</p>
          </Card>
        )}

        {challenge && (
          <Card emoji="🎯" label={t.challenge}>
            <div className={bodyClass} style={display} dangerouslySetInnerHTML={{ __html: challenge }} />
          </Card>
        )}

        {thought && (
          <Card emoji="🌿" label={t.thought}>
            <p className="text-sm italic text-stone-700 leading-relaxed" style={display}>{thought}</p>
          </Card>
        )}

        {alignment && (
          <Card emoji="🪞" label={t.alignment}>
            <p className="text-sm text-stone-700 leading-relaxed" style={display}>{alignment}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
