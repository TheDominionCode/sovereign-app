import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/announcement — default mode returns the most recent ACTIVE
// announcement that the signed-in user hasn't dismissed yet, used by the
// popup card that appears on app open.
//
// GET /api/announcement?all=1 — returns the full list of every active
// announcement the user can see, with a `dismissed` flag on each one,
// used by the letter-inbox icon in the planner header so the user can
// revisit any past message.
//
// Returns { announcement: null } / { announcements: [] } when there's
// nothing to show. Skips pre-launch test accounts (anyone created
// before the public launch date) so old test users don't get spammed
// with broadcasts intended for real customers — owner / admins are
// exempt so the founder can preview her own messages.
const LAUNCH_DATE_ISO = "2026-06-07T00:00:00Z";

export async function GET(req: NextRequest) {
  const wantAll = req.nextUrl.searchParams.get("all") === "1";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return wantAll
      ? NextResponse.json({ announcements: [] })
      : NextResponse.json({ announcement: null });
  }

  const admin = createAdminClient();

  // Pre-launch test accounts skip announcements unless they're either an
  // admin (so the owner / staff can preview their own broadcasts) OR they
  // converted into a real Stripe customer.
  if ((user.created_at as string) < LAUNCH_DATE_ISO) {
    const [{ data: profile }, { data: adminRow }] = await Promise.all([
      admin
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle(),
      admin
        .from("admins")
        .select("email")
        .eq("email", (user.email ?? "").toLowerCase())
        .maybeSingle(),
    ]);
    if (!profile?.stripe_customer_id && !adminRow) {
      return wantAll
        ? NextResponse.json({ announcements: [] })
        : NextResponse.json({ announcement: null });
    }
  }

  // Pull every active announcement + the user's dismissals, then pick the
  // most recent one they haven't dismissed yet. Cheaper than a left join
  // when the announcement table is small (which it will always be).
  const [annRes, dismissRes] = await Promise.all([
    admin
      .from("announcements")
      .select("id, title, body, emoji, audience, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("announcement_dismissals")
      .select("announcement_id")
      .eq("user_id", user.id),
  ]);

  const dismissed = new Set((dismissRes.data ?? []).map((d) => d.announcement_id as string));
  const announcements = annRes.data ?? [];

  if (wantAll) {
    // Inbox mode: every active announcement, with a flag so the inbox
    // UI can dim the ones the user has already read.
    return NextResponse.json({
      announcements: announcements.map((a) => ({
        ...a,
        dismissed: dismissed.has(a.id as string),
      })),
    });
  }

  // Default mode: the next unread one for the popup card.
  const next = announcements.find((a) => !dismissed.has(a.id as string));
  return NextResponse.json({ announcement: next ?? null });
}

// POST /api/announcement (with { announcement_id }) — marks an announcement
// as dismissed for the signed-in user. After this, it never re-appears
// for them. Idempotent: dismissing the same one twice doesn't error.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { announcement_id?: string } = {};
  try { body = await req.json(); } catch { /* empty body is OK below */ }
  const id = body?.announcement_id;
  if (!id) {
    return NextResponse.json({ error: "announcement_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("announcement_dismissals")
    .upsert(
      { user_id: user.id, announcement_id: id },
      { onConflict: "user_id,announcement_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
