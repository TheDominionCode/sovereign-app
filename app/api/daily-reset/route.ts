import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns today's published Daily Reset, or { reset: null } if nothing is
// live yet. Publishing itself happens elsewhere (an admin action, or the
// netlify/functions/publish-daily-resets.mts scheduled job) — this route is
// a pure read with no side effects.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SECTION_KEYS = [
  "sovereign_reset",
  "today_principle",
  "scripture_reflection",
  "brain_science",
  "today_challenge",
  "sovereign_thought",
] as const;

type Row = Record<string, string | number | null>;

function shape(row: Row) {
  const out: Record<string, unknown> = {
    dayNumber: row.day_number,
    date: row.date,
    theme: row.theme,
  };
  for (const key of SECTION_KEYS) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = { en: row[`${key}_en`] ?? "", es: row[`${key}_es`] ?? "" };
  }
  return out;
}

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const admin = createAdminClient();

    const cols = ["day_number", "date", "theme", ...SECTION_KEYS.flatMap((k) => [`${k}_en`, `${k}_es`])].join(",");

    // Prefer an exact match for today's date...
    const { data: exact } = await admin
      .from("daily_resets")
      .select(cols)
      .eq("status", "published")
      .eq("date", today)
      .limit(1)
      .maybeSingle();

    if (exact) {
      return NextResponse.json({ reset: shape(exact as unknown as Row) }, { headers: { "Cache-Control": "no-store" } });
    }

    // ...otherwise fall back to the most recent published reset on or before today.
    const { data: fallback } = await admin
      .from("daily_resets")
      .select(cols)
      .eq("status", "published")
      .lte("date", today)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json(
      { reset: fallback ? shape(fallback as unknown as Row) : null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ reset: null }, { status: 500 });
  }
}
