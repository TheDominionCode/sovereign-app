import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revokeToken } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("calendar_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (row?.access_token) await revokeToken(row.access_token as string);

  await admin.from("calendar_connections").delete().eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
