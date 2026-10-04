import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns the published Daily Reset for today — or for a specific past date
// via ?date=YYYY-MM-DD (Daily History, spec §26/§31) — or { reset: null } if
// nothing is published for that date. Per spec §31, this deliberately does
// NOT fall back to the most recent published day when today's isn't ready;
// the frontend shows a "being prepared" state instead of silently serving
// stale content as if it were today's. Publishing itself happens elsewhere
// (an admin action, or the scheduled Netlify/Supabase functions) — this
// route is a pure read with no side effects.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const COLUMNS = [
  "day_number", "date", "theme", "days_remaining", "season",
  "title_en", "title_es",
  "word_of_day_en", "word_of_day_es", "word_definition_en", "word_definition_es",
  "sovereign_reset_en", "sovereign_reset_es",
  "today_principle_en", "today_principle_es",
  "scripture_reference", "scripture_translation", "scripture_text_en", "scripture_text_es",
  "scripture_reflection_en", "scripture_reflection_es",
  "brain_science_en", "brain_science_es",
  "metacognition_prompt_en", "metacognition_prompt_es",
  "today_challenge_en", "today_challenge_es",
  "sovereign_thought_en", "sovereign_thought_es",
  "alignment_prompt_en", "alignment_prompt_es",
] as const;

type Row = Record<string, string | number | null>;

function bi(row: Row, base: string) {
  return { en: row[`${base}_en`] ?? "", es: row[`${base}_es`] ?? "" };
}

function shape(row: Row) {
  return {
    dayNumber: row.day_number,
    date: row.date,
    daysRemaining: row.days_remaining,
    season: row.season,
    theme: row.theme,
    title: bi(row, "title"),
    wordOfDay: bi(row, "word_of_day"),
    wordDefinition: bi(row, "word_definition"),
    sovereignReset: bi(row, "sovereign_reset"),
    todayPrinciple: bi(row, "today_principle"),
    scriptureReference: row.scripture_reference ?? "",
    scriptureTranslation: row.scripture_translation ?? "",
    scriptureText: bi(row, "scripture_text"),
    scriptureReflection: bi(row, "scripture_reflection"),
    brainScience: bi(row, "brain_science"),
    metacognitionPrompt: bi(row, "metacognition_prompt"),
    todayChallenge: bi(row, "today_challenge"),
    sovereignThought: bi(row, "sovereign_thought"),
    alignmentPrompt: bi(row, "alignment_prompt"),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedDate = url.searchParams.get("date");
    const today = new Date().toISOString().slice(0, 10);
    const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today;

    const admin = createAdminClient();
    const { data } = await admin
      .from("daily_resets")
      .select(COLUMNS.join(","))
      .eq("status", "published")
      .eq("date", date)
      .limit(1)
      .maybeSingle();

    return NextResponse.json(
      { reset: data ? shape(data as unknown as Row) : null, date },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ reset: null }, { status: 500 });
  }
}
