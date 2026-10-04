import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lists previously published Daily Resets (date + title only) so the
// frontend can offer a "Previous days" picker (spec §26/§31). Fetching the
// full content of a specific past day still goes through
// GET /api/daily-reset?date=YYYY-MM-DD.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const admin = createAdminClient();
    const { data } = await admin
      .from("daily_resets")
      .select("date,title_en,title_es,day_number")
      .eq("status", "published")
      .lt("date", today)
      .order("date", { ascending: false })
      .limit(60);

    return NextResponse.json(
      { days: (data ?? []).map((r) => ({ date: r.date, dayNumber: r.day_number, title: { en: r.title_en ?? "", es: r.title_es ?? "" } })) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ days: [] }, { status: 500 });
  }
}
