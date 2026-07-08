import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { description?: string; page?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  if (!description) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("bug_reports").insert({
    user_id: user.id,
    user_email: user.email ?? null,
    description,
    page: (body.page ?? "").trim() || null,
    status: "open",
  });

  if (error) {
    console.error("bug_reports insert error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
