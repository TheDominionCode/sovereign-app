import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeRichText } from "./sanitize";
import { SECTIONS, type DailyResetRow, type SectionKey } from "./types";

const CORE_PHILOSOPHY = `CORE PHILOSOPHY: IDENTITY → INTERNAL ORDER → DOMINION.
The Daily Reset helps women develop: attention, intentionality, self-trust, discipline, confidence, presence, relationships, boundaries, financial awareness, purpose, leadership, faith, and personal responsibility. The 30-day experience should feel like a progression, not a loop — never repeat a previous day's theme, scripture, principle, challenge, closing thought, or signature phrases.`;

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
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Anthropic API error (daily reset):", errText);
    throw new Error("ai_unavailable");
  }

  const json = await res.json();
  const text = json.content?.[0]?.text ?? "";
  if (!text) throw new Error("ai_empty_response");
  return text;
}

function parseJsonLenient(text: string): unknown {
  const stripped = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(stripped);
}

async function fetchPriorContext(admin: SupabaseClient, dayNumber: number): Promise<string> {
  const { data } = await admin
    .from("daily_resets")
    .select("*")
    .lt("day_number", dayNumber)
    .order("day_number", { ascending: false })
    .limit(10);

  if (!data || data.length === 0) return "No previous Daily Resets exist yet — this may be Day 1.";

  return (data as Record<string, unknown>[])
    .map((row: Record<string, unknown>) => {
      const parts = SECTIONS.map((s) => {
        const val = row[`${s.key}_en`] as string | null;
        return val ? `${s.label}: ${stripHtml(val).slice(0, 200)}` : null;
      }).filter(Boolean);
      return `Day ${row.day_number} (theme: ${row.theme ?? "none"}) —\n${parts.join("\n")}`;
    })
    .join("\n\n");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type FullResetContent = Record<SectionKey, { en: string; es: string }>;

export async function generateFullReset(
  admin: SupabaseClient,
  ctx: { dayNumber: number; date: string; theme: string | null; direction: string | null }
): Promise<FullResetContent> {
  const priorContext = await fetchPriorContext(admin, ctx.dayNumber);

  const prompt = `You are the ghostwriter behind Sovereign, a daily personal-development reset for women building a purposeful, disciplined life. ${CORE_PHILOSOPHY}

Day ${ctx.dayNumber} — ${ctx.date}
Theme: ${ctx.theme ?? "(choose one that fits the progression below)"}
Nataly's direction for this specific day: ${ctx.direction ?? "(none given — use your judgment)"}

Previous days, for context so you do NOT repeat themes, scriptures, principles, challenges, or closing thoughts:
${priorContext}

Write today's Daily Reset with exactly these six sections. Each section needs both an English and a Spanish version (natural, warm Spanish — not a literal machine translation). Keep formatting to plain text with at most simple <p>, <b>, <i>, <ul>/<ol>/<li> HTML tags if it helps readability — no markdown, no headings.

1. sovereignReset — a short grounding opener (2-4 sentences) that sets the tone for the day.
2. todayPrinciple — one memorable, quotable principle sentence.
3. scriptureReflection — a relevant Bible verse (reference + text) followed by 2-3 sentences of reflection connecting it to the day's theme. If Nataly's direction says not to use Scripture, replace this with a grounded reflection on the theme instead.
4. brainScience — 2-4 sentences explaining a real psychological or neuroscience concept relevant to the theme, in plain language.
5. todayChallenge — one concrete, doable action for today, 1-3 sentences.
6. sovereignThought — a short closing thought (1-3 sentences) that lands emotionally.

Respond with ONLY a raw JSON object, no markdown code fences, no prose before or after, in exactly this shape:
{"sovereignReset":{"en":"...","es":"..."},"todayPrinciple":{"en":"...","es":"..."},"scriptureReflection":{"en":"...","es":"..."},"brainScience":{"en":"...","es":"..."},"todayChallenge":{"en":"...","es":"..."},"sovereignThought":{"en":"...","es":"..."}}`;

  const text = await callAnthropic(prompt, 2000);
  const parsed = parseJsonLenient(text) as Record<string, { en?: string; es?: string }>;

  const result = {} as FullResetContent;
  for (const s of SECTIONS) {
    const key = camelKey(s.key);
    const val = parsed[key];
    if (!val || !val.en || !val.es) throw new Error("ai_parse_failed");
    result[s.key] = { en: sanitizeRichText(val.en), es: sanitizeRichText(val.es) };
  }
  return result;
}

export async function regenerateOneSection(
  admin: SupabaseClient,
  ctx: {
    dayNumber: number;
    date: string;
    theme: string | null;
    sectionKey: SectionKey;
    sectionLabel: string;
    instruction: string;
    currentRow: DailyResetRow;
  }
): Promise<{ en: string; es: string }> {
  const priorContext = await fetchPriorContext(admin, ctx.dayNumber);

  const otherSections = SECTIONS.filter((s) => s.key !== ctx.sectionKey)
    .map((s) => {
      const en = ctx.currentRow[`${s.key}_en` as keyof DailyResetRow] as string | null;
      return en ? `${s.label}: ${stripHtml(en)}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const prompt = `You are the ghostwriter behind Sovereign, a daily personal-development reset for women building a purposeful, disciplined life. ${CORE_PHILOSOPHY}

Day ${ctx.dayNumber} — ${ctx.date}, theme: ${ctx.theme ?? "none given"}.

You are rewriting ONLY the "${ctx.sectionLabel}" section. Keep it consistent in tone with the other sections already written for this day:
${otherSections || "(no other sections written yet)"}

Nataly's instruction for this rewrite: "${ctx.instruction}"

Previous days, so you do not repeat prior content:
${priorContext}

Respond with ONLY a raw JSON object, no markdown code fences, no prose, in exactly this shape:
{"en":"...","es":"..."}`;

  const text = await callAnthropic(prompt, 700);
  const parsed = parseJsonLenient(text) as { en?: string; es?: string };
  if (!parsed.en || !parsed.es) throw new Error("ai_parse_failed");
  return { en: sanitizeRichText(parsed.en), es: sanitizeRichText(parsed.es) };
}

function camelKey(sectionKey: SectionKey): string {
  return sectionKey.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
