import { createAdminClient } from "@/lib/supabase/admin";

// Server-only helpers for the real, read-only Google Calendar integration
// (app/api/calendar/*). Access/refresh tokens never leave this module and
// the route handlers that call it — the browser only ever sees normalized
// event data, never a token.

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  startTime: string | null; // "HH:MM", null for all-day
  endTime: string | null;
  date: string; // ISO date (YYYY-MM-DD) this event falls on
  allDay: boolean;
  source: "google";
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("Google token refresh failed:", await res.text());
    throw new Error("google_refresh_failed");
  }
  return res.json();
}

// Returns a currently-valid access token for this user, refreshing it first
// if it's expired or about to expire. Returns null if the user has never
// connected, or the connection is dead (no refresh token and the access
// token has expired) — callers should treat that the same as "not connected".
export async function getValidAccessToken(userId: string): Promise<{ accessToken: string; calendarId: string } | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("calendar_connections")
    .select("access_token, refresh_token, token_expires_at, calendar_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!row) return null;

  const expiresAt = new Date(row.token_expires_at as string).getTime();
  const twoMinutes = 2 * 60 * 1000;
  if (Date.now() < expiresAt - twoMinutes) {
    return { accessToken: row.access_token as string, calendarId: row.calendar_id as string };
  }

  if (!row.refresh_token) return null;

  const refreshed = await refreshAccessToken(row.refresh_token as string);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await admin
    .from("calendar_connections")
    .update({ access_token: refreshed.access_token, token_expires_at: newExpiresAt })
    .eq("user_id", userId);

  return { accessToken: refreshed.access_token, calendarId: row.calendar_id as string };
}

type GoogleApiEvent = {
  id: string;
  summary?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
};

export async function fetchEvents(
  accessToken: string,
  calendarId: string,
  timeMinISO: string,
  timeMaxISO: string
): Promise<GoogleCalendarEvent[]> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("timeMin", timeMinISO);
  url.searchParams.set("timeMax", timeMaxISO);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    console.error("Google events fetch failed:", await res.text());
    throw new Error("google_events_failed");
  }

  const json = await res.json();
  const items = (json.items ?? []) as GoogleApiEvent[];

  return items
    .filter((ev) => ev.start && ev.status !== "cancelled")
    .map((ev) => {
      const allDay = Boolean(ev.start?.date);
      const startRaw = ev.start?.dateTime || ev.start?.date || "";
      const endRaw = ev.end?.dateTime || ev.end?.date || "";
      return {
        id: ev.id,
        title: ev.summary || "(untitled)",
        startTime: allDay ? null : startRaw.slice(11, 16),
        endTime: allDay ? null : endRaw.slice(11, 16),
        date: startRaw.slice(0, 10),
        allDay,
        source: "google" as const,
      };
    });
}

// Best-effort revoke on disconnect — leaves nothing dangling on Google's
// side even though we also just delete our own stored copy either way.
export async function revokeToken(accessToken: string): Promise<void> {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, { method: "POST" });
  } catch {
    // Non-fatal — the local row is deleted regardless.
  }
}
