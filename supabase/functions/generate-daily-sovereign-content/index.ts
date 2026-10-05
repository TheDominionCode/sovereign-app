// Supabase Edge Function — the automatic daily generation job (spec §5/§6).
// Runs once a day via pg_cron (see supabase/migrations/20261004000100_
// daily_generation_cron.sql). Mirrors the logic in
// app/admin/daily-reset-manager/_lib/{ai,season}.ts, hand-copied rather than
// imported — there's no shared-module build step between this Deno function
// and the Next.js app, and this function has no dependency on it at runtime.
//
// AI SAFETY (spec §7/§19): ANTHROPIC_API_KEY and the Supabase service-role
// key live only as Edge Function secrets (`supabase secrets set`), never in
// any frontend bundle. This function only ever writes status='draft' —
// unless daily_content_auto_publish is explicitly true, it NEVER sets
// status='published' or published_at itself.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const REST = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

// ---- season.ts, copied (see header note) --------------------------------
const SEASONS = [
  { range: "1-30", name: "Identity", startDay: 1, endDay: 30 },
  { range: "31-60", name: "Mind + Metacognition", startDay: 31, endDay: 60 },
  { range: "61-90", name: "Discipline + Habits", startDay: 61, endDay: 90 },
  { range: "91-120", name: "Confidence + Embodiment", startDay: 91, endDay: 120 },
  { range: "121-150", name: "Relationships + Communication", startDay: 121, endDay: 150 },
  { range: "151-180", name: "Money + Stewardship", startDay: 151, endDay: 180 },
  { range: "181-210", name: "Purpose + Vision", startDay: 181, endDay: 210 },
  { range: "211-240", name: "Spiritual Maturity", startDay: 211, endDay: 240 },
  { range: "241-270", name: "Leadership", startDay: 241, endDay: 270 },
  { range: "271-300", name: "CEO Identity + Sales", startDay: 271, endDay: 300 },
  { range: "301-330", name: "Integration + Dominion", startDay: 301, endDay: 330 },
  { range: "331-365", name: "Mastery + Continuation", startDay: 331, endDay: 366 },
];
function seasonForDayOfYear(dayOfYear: number) {
  return SEASONS.find((s) => dayOfYear >= s.startDay && dayOfYear <= s.endDay) ?? SEASONS[SEASONS.length - 1];
}
function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
function dayMetaForDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const startOfYearUTC = Date.UTC(y, 0, 1);
  const thisDateUTC = Date.UTC(y, m - 1, d);
  const dayOfYear = Math.floor((thisDateUTC - startOfYearUTC) / 86400000) + 1;
  const totalDays = isLeapYear(y) ? 366 : 365;
  return { dayOfYear, daysRemaining: totalDays - dayOfYear, season: seasonForDayOfYear(dayOfYear) };
}

// ---- tiny sanitizer, mirrors _lib/sanitize.ts ----------------------------
const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "ul", "ol", "li", "p", "br"]);
function sanitizeRichText(input: string): string {
  if (!input) return "";
  let out = input.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (tag === "br") return "<br>";
    return match.startsWith("</") ? `</${tag}>` : `<${tag}>`;
  });
  return out.trim();
}
function plain(input: string): string {
  return (input || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const SOVEREIGN_SYSTEM_PROMPT = `You are the ghostwriter behind Sovereign — a Daily Operating System for women, centered on Identity, Faith, Self-Leadership, Discipline, Mind, Metacognition, Health, Money, Stewardship, Purpose, Relationships, Confidence, Leadership, and Dominion. Sovereign is not a generic productivity app.

Brand voice: sophisticated, intelligent, calm, feminine, strong, faith-centered, psychologically informed, grounded, intentional, transformational, premium, editorial, warm, direct. Write like a private, high-level coach speaking directly to one woman.

Never: cheesy motivational language, generic self-help, clichés, excessive emojis, empty affirmations, repetitive content, fake or exaggerated neuroscience claims, shallow religious language.`;

const METACOGNITION_EXAMPLES = [
  "What is my mind doing right now?", "What story am I telling myself?", "What am I assuming?",
  "What evidence do I actually have?", "Is this a thought, interpretation, assumption, evidence, or reality?",
  "Am I reacting or choosing?", "Why did my mind go there?", "Is this belief serving the person I am becoming?",
  "Who taught me to think this way?",
];

async function restGet(path: string) {
  const res = await fetch(`${REST}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`rest_get_failed:${path}:${await res.text()}`);
  return res.json();
}
async function restInsert(table: string, body: unknown) {
  const res = await fetch(`${REST}/${table}`, { method: "POST", headers: { ...HEADERS, Prefer: "return=representation" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`rest_insert_failed:${table}:${await res.text()}`);
  return res.json();
}

async function fetchPriorContext(beforeDate: string): Promise<string> {
  const rows = await restGet(
    `/daily_resets?select=date,title_en,today_principle_en,today_challenge_en,scripture_reference,metacognition_prompt_en,sovereign_thought_en&date=lt.${beforeDate}&order=date.desc&limit=10`
  );
  if (!rows || rows.length === 0) return "No previous Daily Resets exist yet — this is the first one.";
  return rows
    .map((row: Record<string, string>) =>
      `${row.date} — "${row.title_en || "(untitled)"}" | Principle: ${plain(row.today_principle_en || "").slice(0, 160)} | Challenge: ${plain(row.today_challenge_en || "").slice(0, 160)} | Scripture: ${row.scripture_reference || "none"} | Metacognition: ${row.metacognition_prompt_en || ""} | Closing: ${plain(row.sovereign_thought_en || "").slice(0, 120)}`
    )
    .join("\n");
}

async function callAnthropic(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 8000, system: SOVEREIGN_SYSTEM_PROMPT, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`anthropic_failed:${await res.text()}`);
  const json = await res.json();
  // claude-sonnet-5 can return a "thinking" block before the actual "text"
  // block — content[0] is not reliably the answer, find the text block.
  const textBlock = (json.content ?? []).find((c: { type: string }) => c.type === "text");
  const text = textBlock?.text ?? "";
  if (!text) throw new Error("anthropic_empty_response");
  return text;
}

function parseJsonLenient(text: string) {
  const stripped = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(stripped);
}

Deno.serve(async (req: Request) => {
  // SECURITY: Supabase's platform-level verify_jwt only checks that the
  // bearer token is a validly-signed project JWT — it does NOT check role,
  // so the public anon key (shipped in every client bundle) would otherwise
  // pass that gate too. This function performs a privileged, service-role
  // write (and can publish content if auto-publish is on), so it must only
  // ever run for its one legitimate caller: the pg_cron job, which
  // authenticates with the real service-role key pulled from Vault (see
  // supabase/migrations/20261004000100_daily_generation_cron.sql). Reject
  // anything else, including a valid anon-key JWT.
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const logStart = { content_date: date, started_at: new Date().toISOString(), status: "running", model: "claude-sonnet-5", generation_attempt: 1 };
  let logRow: { id: number } | null = null;

  try {
    const [log] = await restInsert("daily_content_generation_logs", logStart);
    if (!log) throw new Error("log_insert_failed");
    logRow = log;

    // Idempotent: never create a second row for the same date (spec §5/§6).
    const existing = await restGet(`/daily_resets?select=id&date=eq.${date}`);
    if (existing && existing.length > 0) {
      await fetch(`${REST}/daily_content_generation_logs?id=eq.${logRow!.id}`, {
        method: "PATCH", headers: HEADERS,
        body: JSON.stringify({ status: "skipped_exists", completed_at: new Date().toISOString() }),
      });
      return new Response(JSON.stringify({ skipped: true, reason: "already_exists", date }), { status: 200 });
    }

    const settingsRows = await restGet(`/app_settings?select=key,value&key=in.(daily_generation_enabled,daily_content_auto_publish)`);
    const settings = Object.fromEntries((settingsRows || []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
    if (settings.daily_generation_enabled === false) {
      await fetch(`${REST}/daily_content_generation_logs?id=eq.${logRow!.id}`, {
        method: "PATCH", headers: HEADERS,
        body: JSON.stringify({ status: "skipped_exists", error_message: "daily_generation_enabled is OFF", completed_at: new Date().toISOString() }),
      });
      return new Response(JSON.stringify({ skipped: true, reason: "generation_disabled", date }), { status: 200 });
    }
    const autoPublish = settings.daily_content_auto_publish === true;

    const { dayOfYear, daysRemaining, season } = dayMetaForDate(date);
    const priorContext = await fetchPriorContext(date);
    const dateLabel = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

    const prompt = `Write today's complete Sovereign Daily Content.

Day ${dayOfYear} of the year — ${dateLabel}. ${daysRemaining} days remain in the year.
Current season (30-day progression block): "${season.name}" (days ${season.range}). Write within this season's focus.

Recent days, so you do not repeat a title, principle, challenge, scripture reference, or metacognition prompt:
${priorContext}

Rotate metacognition prompts intelligently — draw from or riff on ideas like: ${METACOGNITION_EXAMPLES.join(" / ")}. Do not reuse the same one two days running.

Write EVERY field below in both English and Spanish (natural, warm Spanish — not a literal translation), except scriptureReference and scriptureTranslation which are language-neutral. Keep formatting to plain text, with at most simple <p>, <b>, <i>, <ul>/<ol>/<li> tags in the longer fields if it helps readability. Keep sections phone-readable.

1. title — a short, specific day title, not generic.
2. wordOfDay + wordDefinition — one word that anchors today, with a one-sentence definition.
3. sovereignReset — a short grounding opener (2-4 sentences). Do NOT include the day number or date in this text.
4. todayPrinciple — one memorable principle, then 2-4 concise paragraphs of explanation.
5. scriptureReference + scriptureText + scriptureReflection — a real, verifiable Bible verse (NASB in English). NEVER invent or paraphrase Scripture you are not confident is accurate — if unsure, return scriptureText as an empty string and set needsReview to true, but still give the reference. scriptureReflection (2-4 paragraphs) connects the verse to today's principle.
6. brainScience — 2-4 paragraphs on real behavioral/cognitive science relevant to today. No unsupported or exaggerated claims.
7. metacognitionPrompt — ONE rotating prompt teaching her to observe her thinking.
8. todayChallenge — ONE specific, measurable, doable-today action. Never vague.
9. sovereignThought — one concise, original closing thought.
10. alignmentPrompt — one reflection prompt comparing who she says she is becoming to how she acted today.

Respond with ONLY a raw JSON object, no markdown fences, no prose, in exactly this shape:
{"title":{"en":"","es":""},"wordOfDay":{"en":"","es":""},"wordDefinition":{"en":"","es":""},"sovereignReset":{"en":"","es":""},"todayPrinciple":{"en":"","es":""},"scriptureReference":"","scriptureText":{"en":"","es":""},"scriptureReflection":{"en":"","es":""},"brainScience":{"en":"","es":""},"metacognitionPrompt":{"en":"","es":""},"todayChallenge":{"en":"","es":""},"sovereignThought":{"en":"","es":""},"alignmentPrompt":{"en":"","es":""},"needsReview":false}`;

    const text = await callAnthropic(prompt);
    const parsed = parseJsonLenient(text);

    const bi = (key: string) => {
      const v = parsed[key];
      if (!v || typeof v.en !== "string" || typeof v.es !== "string") throw new Error(`ai_parse_failed:${key}`);
      return v;
    };
    const title = bi("title"), wordOfDay = bi("wordOfDay"), wordDefinition = bi("wordDefinition");
    const sovereignReset = bi("sovereignReset"), todayPrinciple = bi("todayPrinciple");
    const scriptureText = bi("scriptureText"), scriptureReflection = bi("scriptureReflection");
    const brainScience = bi("brainScience"), metacognitionPrompt = bi("metacognitionPrompt");
    const todayChallenge = bi("todayChallenge"), sovereignThought = bi("sovereignThought"), alignmentPrompt = bi("alignmentPrompt");
    const scriptureReference = typeof parsed.scriptureReference === "string" ? parsed.scriptureReference : "";
    const needsReview = Boolean(parsed.needsReview) || (!!scriptureReference && !scriptureText.en.trim());

    const row = {
      day_number: dayOfYear,
      date,
      days_remaining: daysRemaining,
      season: season.name,
      status: autoPublish ? "published" : "draft",
      ai_generated: true,
      admin_approved: autoPublish, // only true because the admin explicitly turned auto-publish on — see spec §4/§19
      published_at: autoPublish ? new Date().toISOString() : null,
      needs_review: needsReview,
      title_en: plain(title.en), title_es: plain(title.es),
      word_of_day_en: plain(wordOfDay.en), word_of_day_es: plain(wordOfDay.es),
      word_definition_en: plain(wordDefinition.en), word_definition_es: plain(wordDefinition.es),
      sovereign_reset_en: sanitizeRichText(sovereignReset.en), sovereign_reset_es: sanitizeRichText(sovereignReset.es),
      today_principle_en: sanitizeRichText(todayPrinciple.en), today_principle_es: sanitizeRichText(todayPrinciple.es),
      scripture_reference: plain(scriptureReference), scripture_translation: "NASB",
      scripture_text_en: plain(scriptureText.en), scripture_text_es: plain(scriptureText.es),
      scripture_reflection_en: sanitizeRichText(scriptureReflection.en), scripture_reflection_es: sanitizeRichText(scriptureReflection.es),
      brain_science_en: sanitizeRichText(brainScience.en), brain_science_es: sanitizeRichText(brainScience.es),
      metacognition_prompt_en: plain(metacognitionPrompt.en), metacognition_prompt_es: plain(metacognitionPrompt.es),
      today_challenge_en: sanitizeRichText(todayChallenge.en), today_challenge_es: sanitizeRichText(todayChallenge.es),
      sovereign_thought_en: sanitizeRichText(sovereignThought.en), sovereign_thought_es: sanitizeRichText(sovereignThought.es),
      alignment_prompt_en: plain(alignmentPrompt.en), alignment_prompt_es: plain(alignmentPrompt.es),
      created_by: "system:generate-daily-sovereign-content",
      updated_by: "system:generate-daily-sovereign-content",
    };

    const [created] = await restInsert("daily_resets", row);
    await restInsert("daily_reset_versions", {
      daily_reset_id: created.id,
      version_number: 1,
      snapshot: created,
      change_type: "ai_generated",
      created_by: "system:generate-daily-sovereign-content",
    });

    await fetch(`${REST}/daily_content_generation_logs?id=eq.${logRow!.id}`, {
      method: "PATCH", headers: HEADERS,
      body: JSON.stringify({ status: "success", completed_at: new Date().toISOString() }),
    });

    return new Response(JSON.stringify({ created: true, id: created.id, date, status: row.status }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("generate-daily-sovereign-content failed:", message);
    if (logRow) {
      await fetch(`${REST}/daily_content_generation_logs?id=eq.${logRow!.id}`, {
        method: "PATCH", headers: HEADERS,
        body: JSON.stringify({ status: "failure", error_message: message, completed_at: new Date().toISOString() }),
      }).catch(() => {});
    }
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
