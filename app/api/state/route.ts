import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Cloud key/value store backing the Sovereign app's window.storage wrapper.
// Auth comes from the existing Supabase session cookies (same-origin requests
// from the /os.html iframe carry them), and row-level security scopes every
// row to the signed-in user.

export const dynamic = "force-dynamic";

type Entry = { key: string; value: string };

// Bumps the user's last_active_at timestamp. Throttled so we only write
// once every ~10 minutes per user (the planner makes lots of state reads;
// we don't need every single one to hit the DB). Fire-and-forget: if the
// update fails we still serve the page so the user never sees a slowdown.
const ACTIVITY_THROTTLE_MS = 10 * 60 * 1000; // 10 minutes
async function bumpLastActive(userId: string): Promise<void> {
  try {
    // Must use the admin client — profiles has no UPDATE RLS policy for users.
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("last_active_at")
      .eq("id", userId)
      .maybeSingle();
    const last = (data as { last_active_at?: string | null } | null)?.last_active_at;
    if (last && Date.now() - new Date(last).getTime() < ACTIVITY_THROTTLE_MS) {
      return;
    }
    await admin
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", userId);
  } catch {
    /* silently ignore — never block the request on activity logging */
  }
}

// GET /api/state -> { state: { [key]: value } }
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Fire-and-forget activity bump.
  void bumpLastActive(user.id);

  const { data, error } = await supabase
    .from("app_state")
    .select("key,value")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const state: Record<string, string> = {};
  for (const row of data ?? []) {
    state[row.key as string] = (row.value as string) ?? "";
  }

  // First-load identity seed — the standalone Sovereign app inside the iframe
  // has a hardcoded fallback user ("Nataly / natalyg") it uses when `dom_user`
  // isn't in storage. For every new signed-in user, the cloud state starts
  // empty, so the fallback would show — meaning Chanel would see "Nataly" as
  // her name. To prevent that, seed `dom_user` from the profile on first GET
  // and persist it so subsequent loads (and future devices) see the right
  // name immediately.
  if (!state.dom_user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    const emailLocal = (profile?.email || user.email || "user").split("@")[0];
    const displayName =
      (profile?.full_name && String(profile.full_name).trim()) ||
      emailLocal;
    const userObj = JSON.stringify({
      username: emailLocal.toLowerCase().replace(/[^a-z0-9]/g, ""),
      name: displayName,
    });
    state.dom_user = userObj;
    // Persist so the next reload (or another device) finds it without
    // re-running this seeding step.
    await supabase.from("app_state").upsert(
      { user_id: user.id, key: "dom_user", value: userObj },
      { onConflict: "user_id,key" }
    );
  }

  return NextResponse.json({ state });
}

// PUT /api/state  body: { entries: [{ key, value }] } -> upsert
export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const entries = (body as { entries?: unknown })?.entries;
  if (!Array.isArray(entries)) {
    return NextResponse.json({ error: "entries[] required" }, { status: 400 });
  }

  const rows = entries
    .filter(
      (e): e is Entry =>
        !!e &&
        typeof (e as Entry).key === "string" &&
        typeof (e as Entry).value === "string"
    )
    .map((e) => ({
      user_id: user.id,
      key: e.key,
      value: e.value,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, written: 0 });
  }

  const { error } = await supabase
    .from("app_state")
    .upsert(rows, { onConflict: "user_id,key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, written: rows.length });
}

// DELETE /api/state  body: { keys: [string] }
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const keys = (body as { keys?: unknown })?.keys;
  if (!Array.isArray(keys) || keys.some((k) => typeof k !== "string")) {
    return NextResponse.json({ error: "keys[] required" }, { status: 400 });
  }
  if (keys.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const { error } = await supabase
    .from("app_state")
    .delete()
    .eq("user_id", user.id)
    .in("key", keys as string[]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, deleted: keys.length });
}
