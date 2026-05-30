import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run any code between createServerClient and supabase.auth.getUser().
  // A simple mistake here can cause hard-to-debug session-refresh bugs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Beta invite capture — if the URL includes ?beta=<code> and it matches
  // BETA_INVITE_CODE, drop a 30-day cookie AND redirect the visitor straight
  // to /signup (or /app if already signed in) so they never have to hunt for
  // the right button on the marketing page.
  const betaParam = request.nextUrl.searchParams.get("beta");
  const expected = process.env.BETA_INVITE_CODE;
  if (betaParam && expected && betaParam === expected) {
    const dest = request.nextUrl.clone();
    dest.search = "";
    dest.pathname = user ? "/app" : "/signup";
    if (!user) dest.searchParams.set("next", "/app");
    const res = NextResponse.redirect(dest);
    res.cookies.set("beta_invite", expected, {
      httpOnly: true,
      sameSite: "lax",
      secure: !request.nextUrl.hostname.startsWith("localhost"),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  const requiresAuth =
    path.startsWith("/app") ||
    path.startsWith("/billing") ||
    path.startsWith("/admin") ||
    path.startsWith("/os.html");

  if (requiresAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
