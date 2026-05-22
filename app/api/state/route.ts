import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cloud key/value store backing the Sovereign app's window.storage wrapper.
// Auth comes from the existing Supabase session cookies (same-origin requests
// from the /os.html iframe carry them), and row-level security scopes every
// row to the signed-in user.

export const dynamic = "force-dynamic";

type Entry = { key: string; value: string };

// GET /api/state -> { state: { [key]: value } }
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
