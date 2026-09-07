import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken, fetchEvents } from "@/lib/google/calendar";

// Read-only merge source for the Life Calendar grid. Returns normalized
// Google events for the requested [from, to) range; the browser never
// talks to Google or sees a token — only this route does.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false, events: [] }, { status: 401 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "missing_range" }, { status: 400 });
  }

  try {
    const conn = await getValidAccessToken(user.id);
    if (!conn) return NextResponse.json({ connected: false, events: [] });

    const events = await fetchEvents(conn.accessToken, conn.calendarId, new Date(from).toISOString(), new Date(to).toISOString());
    return NextResponse.json({ connected: true, events }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("calendar events route failed:", e);
    return NextResponse.json({ connected: true, events: [], error: "fetch_failed" }, { status: 500 });
  }
}
