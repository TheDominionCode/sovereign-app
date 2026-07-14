import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns today's active principle, reflection, question, and intentions list.
// Rotation logic: if a row has display_date = today, use it; otherwise pick
// by dayOfYear % count from the active-and-unscheduled pool.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = { id: number; content_en: string; content_es: string; display_date?: string | null; sort_order?: number | null };

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

async function pickOne(
  table: string,
  today: string,
  doy: number
): Promise<Row | null> {
  const admin = createAdminClient();

  // Prefer a row scheduled for exactly today
  const { data: scheduled } = await admin
    .from(table)
    .select("id,content_en,content_es,display_date")
    .eq("active", true)
    .eq("display_date", today)
    .limit(1)
    .maybeSingle();

  if (scheduled) return scheduled as Row;

  // Fall back to rotation from unscheduled active pool
  const { data: pool } = await admin
    .from(table)
    .select("id,content_en,content_es")
    .eq("active", true)
    .is("display_date", null)
    .order("id");

  if (!pool || pool.length === 0) return null;
  return (pool[doy % pool.length]) as Row;
}

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const doy = dayOfYear(new Date());
    const admin = createAdminClient();

    const [principle, reflection, question, intentionsRes, questionsRes] = await Promise.all([
      pickOne("daily_principles", today, doy),
      pickOne("daily_reflections", today, doy),
      pickOne("daily_questions", today, doy),
      admin
        .from("daily_intentions")
        .select("id,content_en,content_es,sort_order")
        .eq("active", true)
        .order("sort_order")
        .order("id"),
      // All active questions — used as the Reflection Questions list in the Mind module
      admin
        .from("daily_questions")
        .select("id,content_en,content_es")
        .eq("active", true)
        .is("display_date", null)
        .order("id"),
    ]);

    return NextResponse.json(
      {
        principle: principle
          ? { en: principle.content_en, es: principle.content_es }
          : null,
        reflection: reflection
          ? { en: reflection.content_en, es: reflection.content_es }
          : null,
        question: question
          ? { en: question.content_en, es: question.content_es }
          : null,
        // Full list of active questions for the Mind module's Reflection Questions section
        questions: (questionsRes.data ?? []).map((r: Row) => ({
          en: r.content_en,
          es: r.content_es,
        })),
        intentions: (intentionsRes.data ?? []).map((r: Row) => ({
          id: String(r.id),
          en: r.content_en,
          es: r.content_es,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json({ principle: null, reflection: null, question: null, questions: [], intentions: [] }, { status: 500 });
  }
}
