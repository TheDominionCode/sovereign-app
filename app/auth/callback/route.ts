import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles OAuth callback + email-confirmation links from Supabase Auth.
// Exchanges the ?code= param for a session, then redirects to ?next=.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(safeNext)}`,
          req.url
        )
      );
    }
  }

  return NextResponse.redirect(new URL(safeNext, req.url));
}
