import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeRichText } from "./sanitize";
import { SECTIONS, type DailyResetRow, type SectionKey } from "./types";
import { dayMetaForDate } from "./season";

// ---- Sovereign brand voice (spec §8) ----------------------------------
export const SOVEREIGN_SYSTEM_PROMPT = `You are the ghostwriter behind Sovereign — a Daily Operating System for women, centered on Identity, Faith, Self-Leadership, Discipline, Mind, Metacognition, Health, Money, Stewardship, Purpose, Relationships, Confidence, Leadership, and Dominion. Sovereign is not a generic productivity app.

Brand voice: sophisticated, intelligent, calm, feminine, strong, faith-centered, psychologically informed, grounded, intentional, transformational, premium, editorial, warm, direct. Write like a private, high-level coach speaking directly to one woman.

Never: cheesy motivational language, generic self-help, clichés, excessive emojis, empty affirmations, repetitive content, fake or exaggerated neuroscience claims, shallow religious language.`;

async function callAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ai_unavailable");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: maxTokens,
      system: SOVEREIGN_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Anthropic API error (daily reset):", errText);
    throw new Error("ai_unavailable");
  }

  const json = await res.json();
  // claude-sonnet-5 can return a "thinking" block before the actual "text"
  // block — content[0] is not reliably the answer, find the text block.
  const textBlock = (json.content ?? []).find((c: { type: string }) => c.type === "text");
  const text = textBlock?.text ?? "";
  if (!text) throw new Error("ai_empty_response");
  return text;
}

function parseJsonLenient(text: string): unknown {
  const stripped = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(stripped);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Anti-repetition context (spec §41, §17): the last ~10 days' titles,
// principles, challenges, scripture references, and metacognition prompts —
// enough for the model to avoid repeating itself without re-sending a
// year's worth of content on every call.
async function fetchPriorContext(admin: SupabaseClient, beforeDate: string): Promise<string> {
  const { data } = await admin
    .from("daily_resets")
    .select("date,title_en,today_principle_en,today_challenge_en,scripture_reference,metacognition_prompt_en,sovereign_thought_en")
    .lt("date", beforeDate)
    .order("date", { ascending: false })
    .limit(10);

  if (!data || data.length === 0) return "No previous Daily Resets exist yet — this is the first one.";

  return (data as Record<string, unknown>[])
    .map((row) => {
      const title = row.title_en ? String(row.title_en) : "(untitled)";
      const principle = row.today_principle_en ? stripHtml(String(row.today_principle_en)).slice(0, 160) : "";
      const challenge = row.today_challenge_en ? stripHtml(String(row.today_challenge_en)).slice(0, 160) : "";
      const thought = row.sovereign_thought_en ? stripHtml(String(row.sovereign_thought_en)).slice(0, 120) : "";
      const scripture = row.scripture_reference ? String(row.scripture_reference) : "none";
      const metacog = row.metacognition_prompt_en ? String(row.metacognition_prompt_en) : "";
      return `${row.date} — "${title}" | Principle: ${principle} | Challenge: ${challenge} | Scripture: ${scripture} | Metacognition: ${metacog} | Closing: ${thought}`;
    })
    .join("\n");
}

const METACOGNITION_EXAMPLES = [
  "What is my mind doing right now?",
  "What story am I telling myself?",
  "What am I assuming?",
  "What evidence do I actually have?",
  "Is this a thought, interpretation, assumption, evidence, or reality?",
  "Am I reacting or choosing?",
  "Why did my mind go there?",
  "Is this belief serving the person I am becoming?",
  "Who taught me to think this way?",
];

type GeneratedFields = Record<string, string>;

function sanitizeField(kind: "richtext" | "plain", value: string): string {
  return kind === "richtext" ? sanitizeRichText(value) : stripHtml(value).trim();
}

// Produces every field on the row in one call (one Anthropic request per
// day, not one per section — cost control, spec §34). Returns a flat
// {column: value} map covering every SECTIONS field plus days_remaining/
// season, ready to spread into an update/insert payload.
export async function generateFullReset(
  admin: SupabaseClient,
  ctx: { date: string; theme: string | null; direction: string | null }
): Promise<GeneratedFields> {
  const { dayOfYear, daysRemaining, season } = dayMetaForDate(ctx.date);
  const priorContext = await fetchPriorContext(admin, ctx.date);
  const dateLabel = new Date(ctx.date + "T00:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  const prompt = `Write today's complete Sovereign Daily Content.

Day ${dayOfYear} of the year — ${dateLabel}. ${daysRemaining} days remain in the year.
Current season (30-day progression block): "${season.name}" (days ${season.range}). Write within this season's focus unless Nataly's direction below says otherwise.
Theme override: ${ctx.theme ?? "(none — follow the season)"}
Nataly's direction for today: ${ctx.direction ?? "(none given — use your judgment)"}

Recent days, so you do not repeat a title, principle, challenge, scripture reference, or metacognition prompt:
${priorContext}

Rotate metacognition prompts intelligently — draw from or riff on ideas like: ${METACOGNITION_EXAMPLES.join(" / ")}. Do not reuse the same one two days running.

Write EVERY field below in both English and Spanish (natural, warm Spanish — not a literal translation), except scriptureReference and scriptureTranslation which are language-neutral. Keep formatting to plain text, with at most simple <p>, <b>, <i>, <ul>/<ol>/<li> tags in the longer fields if it helps readability — no markdown, no headings. Keep sections phone-readable: Sovereign Reset/Challenge/Sovereign Thought short; Principle/Scripture Reflection/Brain Science 2-4 concise paragraphs; prompts one strong sentence.

1. title — a short, specific day title (e.g. "There Is Still Time"), not generic.
2. wordOfDay + wordDefinition — one word that anchors today, with a one-sentence definition in Sovereign's voice.
3. sovereignReset — a short grounding opener (2-4 sentences) that sets today's tone. Do NOT include the day number or date in this text — that's rendered separately from computed values.
4. todayPrinciple — one memorable, quotable principle, then 2-4 concise paragraphs of explanation (transformation, not motivation).
5. scriptureReference + scriptureText + scriptureReflection — a real, verifiable Bible verse relevant to today (translation: NASB in English). NEVER invent or paraphrase Scripture you are not confident is accurate — if you cannot confidently produce the exact verse text, return scriptureText as an empty string and set needsReview to true, but still give the reference. scriptureReflection (2-4 paragraphs) connects the verse directly to today's principle. If Nataly's direction says not to use Scripture, use scriptureReference "" and write a grounded secular reflection in scriptureReflection instead.
6. brainScience — 2-4 paragraphs on the real behavioral/cognitive science behind today's lesson (habit formation, neuroplasticity, attention, metacognition, decision-making, emotional regulation, cognitive bias, identity-based behavior, reward prediction — pick what fits). No unsupported or exaggerated claims.
7. metacognitionPrompt — ONE rotating prompt teaching her to observe her thinking rather than believe every thought automatically.
8. todayChallenge — ONE specific, measurable, doable-today action tied to the lesson. Never vague ("believe in yourself"); always concrete ("before noon, do X for 15 minutes").
9. sovereignThought — one concise, original closing thought (not a generic quote).
10. alignmentPrompt — one reflection prompt comparing who she says she is becoming to how she acted today.

Respond with ONLY a raw JSON object, no markdown fences, no prose, in exactly this shape:
{"title":{"en":"","es":""},"wordOfDay":{"en":"","es":""},"wordDefinition":{"en":"","es":""},"sovereignReset":{"en":"","es":""},"todayPrinciple":{"en":"","es":""},"scriptureReference":"","scriptureText":{"en":"","es":""},"scriptureReflection":{"en":"","es":""},"brainScience":{"en":"","es":""},"metacognitionPrompt":{"en":"","es":""},"todayChallenge":{"en":"","es":""},"sovereignThought":{"en":"","es":""},"alignmentPrompt":{"en":"","es":""},"needsReview":false}`;

  const text = await callAnthropic(prompt, 3500);
  const parsed = parseJsonLenient(text) as Record<string, unknown>;

  const bi = (key: string): { en: string; es: string } => {
    const v = parsed[key] as { en?: string; es?: string } | undefined;
    if (!v || typeof v.en !== "string" || typeof v.es !== "string") throw new Error("ai_parse_failed");
    return { en: v.en, es: v.es };
  };

  const title = bi("title");
  const wordOfDay = bi("wordOfDay");
  const wordDefinition = bi("wordDefinition");
  const sovereignReset = bi("sovereignReset");
  const todayPrinciple = bi("todayPrinciple");
  const scriptureText = bi("scriptureText");
  const scriptureReflection = bi("scriptureReflection");
  const brainScience = bi("brainScience");
  const metacognitionPrompt = bi("metacognitionPrompt");
  const todayChallenge = bi("todayChallenge");
  const sovereignThought = bi("sovereignThought");
  const alignmentPrompt = bi("alignmentPrompt");
  const scriptureReference = typeof parsed.scriptureReference === "string" ? parsed.scriptureReference : "";
  const needsReview = Boolean(parsed.needsReview) || (!!scriptureReference && !scriptureText.en.trim());

  const fields: GeneratedFields = {
    title_en: sanitizeField("plain", title.en),
    title_es: sanitizeField("plain", title.es),
    word_of_day_en: sanitizeField("plain", wordOfDay.en),
    word_of_day_es: sanitizeField("plain", wordOfDay.es),
    word_definition_en: sanitizeField("plain", wordDefinition.en),
    word_definition_es: sanitizeField("plain", wordDefinition.es),
    sovereign_reset_en: sanitizeField("richtext", sovereignReset.en),
    sovereign_reset_es: sanitizeField("richtext", sovereignReset.es),
    today_principle_en: sanitizeField("richtext", todayPrinciple.en),
    today_principle_es: sanitizeField("richtext", todayPrinciple.es),
    scripture_reference: sanitizeField("plain", scriptureReference),
    scripture_text_en: sanitizeField("plain", scriptureText.en),
    scripture_text_es: sanitizeField("plain", scriptureText.es),
    scripture_reflection_en: sanitizeField("richtext", scriptureReflection.en),
    scripture_reflection_es: sanitizeField("richtext", scriptureReflection.es),
    brain_science_en: sanitizeField("richtext", brainScience.en),
    brain_science_es: sanitizeField("richtext", brainScience.es),
    metacognition_prompt_en: sanitizeField("plain", metacognitionPrompt.en),
    metacognition_prompt_es: sanitizeField("plain", metacognitionPrompt.es),
    today_challenge_en: sanitizeField("richtext", todayChallenge.en),
    today_challenge_es: sanitizeField("richtext", todayChallenge.es),
    sovereign_thought_en: sanitizeField("richtext", sovereignThought.en),
    sovereign_thought_es: sanitizeField("richtext", sovereignThought.es),
    alignment_prompt_en: sanitizeField("plain", alignmentPrompt.en),
    alignment_prompt_es: sanitizeField("plain", alignmentPrompt.es),
  };

  return { ...fields, days_remaining: String(daysRemaining), season: season.name, _needsReview: String(needsReview) };
}

// Regenerates just one section's fields (spec §20) — given the OTHER
// sections' current content for tone coherence, and the same
// anti-repetition context as a full generation.
export async function regenerateOneSection(
  admin: SupabaseClient,
  ctx: {
    date: string;
    theme: string | null;
    sectionKey: SectionKey;
    sectionLabel: string;
    instruction: string;
    currentRow: DailyResetRow;
  }
): Promise<GeneratedFields> {
  const { dayOfYear, daysRemaining, season } = dayMetaForDate(ctx.date);
  const priorContext = await fetchPriorContext(admin, ctx.date);
  const section = SECTIONS.find((s) => s.key === ctx.sectionKey);
  if (!section) throw new Error("invalid_section");

  const otherContext = SECTIONS.filter((s) => s.key !== ctx.sectionKey)
    .map((s) => {
      const enField = s.fields.find((f) => f.column.endsWith("_en")) ?? s.fields[0];
      const val = ctx.currentRow[enField.column as keyof DailyResetRow] as string | null;
      return val ? `${s.label}: ${stripHtml(val).slice(0, 160)}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const needsScripture = ctx.sectionKey === "scripture";
  const shape = section.fields
    .map((f) => (f.column.endsWith("_en") ? f.column.replace(/_en$/, "") : f.column.endsWith("_es") ? null : f.column))
    .filter((v, i, arr) => v && arr.indexOf(v) === i);
  const jsonShapeHint = shape
    .map((base) => {
      const camel = (base as string).replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      const hasEs = section.fields.some((f) => f.column === `${base}_es`);
      return hasEs ? `"${camel}":{"en":"","es":""}` : `"${camel}":""`;
    })
    .join(",");

  const prompt = `Day ${dayOfYear} of the year — ${daysRemaining} days remain. Season: "${season.name}".

You are rewriting ONLY the "${ctx.sectionLabel}" part of today's Sovereign Daily Content. Stay consistent in tone with what's already written for today:
${otherContext || "(no other sections written yet)"}

Nataly's instruction for this rewrite: "${ctx.instruction}"
${needsScripture ? "Never invent Scripture you are not confident is accurate — if unsure of exact verse text, leave scriptureText empty and keep the reference." : ""}

Recent days, so you do not repeat yourself:
${priorContext}

Respond with ONLY a raw JSON object, no markdown fences, no prose, in exactly this shape:
{${jsonShapeHint}}`;

  const text = await callAnthropic(prompt, 1200);
  const parsed = parseJsonLenient(text) as Record<string, unknown>;

  const fields: GeneratedFields = {};
  for (const f of section.fields) {
    if (f.column === "scripture_reference" || f.column === "scripture_translation") {
      const base = f.column === "scripture_reference" ? "scriptureReference" : "scriptureTranslation";
      const val = parsed[base];
      fields[f.column] = sanitizeField("plain", typeof val === "string" ? val : "");
      continue;
    }
    const isEs = f.column.endsWith("_es");
    const base = f.column.replace(/_(en|es)$/, "");
    const camel = base.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    const node = parsed[camel] as { en?: string; es?: string } | string | undefined;
    const raw = typeof node === "string" ? node : isEs ? node?.es : node?.en;
    if (typeof raw !== "string") throw new Error("ai_parse_failed");
    fields[f.column] = sanitizeField(f.kind, raw);
  }
  return fields;
}
