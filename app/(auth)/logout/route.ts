import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function signOutAndRedirect(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", req.url));
}

// Accept both verbs: forms POST, but the in-app "Sign out" button does a
// top-frame navigation (GET) — without a GET handler the browser was
// downloading the 405 body instead of signing the user out.
export async function GET(req: NextRequest) {
  return signOutAndRedirect(req);
}

export async function POST(req: NextRequest) {
  return signOutAndRedirect(req);
}
