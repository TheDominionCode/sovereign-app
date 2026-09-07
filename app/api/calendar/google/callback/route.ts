import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gcal_oauth_state")?.value;
  cookieStore.delete("gcal_oauth_state");

  if (errorParam || !code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${site}/app?calendar=error`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${site}/login?next=/app`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      redirect_uri: `${site}/api/calendar/google/callback`,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!tokenRes.ok) {
    console.error("Google token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${site}/app?calendar=error`);
  }

  const tokenJson: { access_token: string; refresh_token?: string; expires_in: number } = await tokenRes.json();
  const tokenExpiresAt = new Date(Date.now() + tokenJson.expires_in * 1000).toISOString();

  const admin = createAdminClient();

  // Google only sends refresh_token on first consent (we always pass
  // prompt=consent so re-connecting also gets one) — but if it's ever
  // missing, keep whatever refresh_token this user already had rather than
  // clobbering it with null.
  const upsert: Record<string, unknown> = {
    user_id: user.id,
    provider: "google",
    access_token: tokenJson.access_token,
    token_expires_at: tokenExpiresAt,
    calendar_id: "primary",
  };

  if (tokenJson.refresh_token) {
    upsert.refresh_token = tokenJson.refresh_token;
  } else {
    const { data: existing } = await admin
      .from("calendar_connections")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing?.refresh_token) upsert.refresh_token = existing.refresh_token;
  }

  const { error: upsertError } = await admin.from("calendar_connections").upsert(upsert, { onConflict: "user_id" });
  if (upsertError) {
    console.error("calendar_connections upsert failed:", upsertError);
    return NextResponse.redirect(`${site}/app?calendar=error`);
  }

  return NextResponse.redirect(`${site}/app?calendar=connected`);
}
