import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("calendar_connections")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ connected: Boolean(data) }, { headers: { "Cache-Control": "no-store" } });
}
