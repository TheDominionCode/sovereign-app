import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Keep Supabase auth cookies alive for the maximum the spec allows so
// closing the tab, backgrounding the PWA, putting the phone to sleep, or
// switching networks doesn't wipe the session. We only extend non-empty
// cookie values — signout still clears properly because Supabase
// rewrites the cookie with an empty value + maxAge: 0, which we honor.
//
// Chrome caps cookie lifetime at 400 days (~34.5M seconds); we use that.
// We also drop any `expires` Date the SDK supplied so it can't shorten
// maxAge, force `sameSite: lax` so OAuth + email-callback redirects keep
// the cookie, set `path: '/'` so any page in the app can read it, and
// flag `secure` outside localhost so iOS Safari doesn't silently reject
// cross-restart cookies.
const FOUR_HUNDRED_DAYS_SECONDS = 60 * 60 * 24 * 400;
function extendAuthCookie(
  name: string,
  value: string,
  options: CookieOptions | undefined,
  isLocalhost: boolean
): CookieOptions | undefined {
  if (!name.startsWith("sb-") || !value) return options;
  const next: CookieOptions = { ...(options || {}) };
  if (!next.maxAge || next.maxAge < FOUR_HUNDRED_DAYS_SECONDS) next.maxAge = FOUR_HUNDRED_DAYS_SECONDS;
  delete (next as { expires?: unknown }).expires;
  if (!next.sameSite) next.sameSite = "lax";
  if (!next.path) next.path = "/";
  if (next.secure === undefined) next.secure = !isLocalhost;
  return next;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const isLocalhost = request.nextUrl.hostname.startsWith("localhost");

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
            supabaseResponse.cookies.set(name, value, extendAuthCookie(name, value, options, isLocalhost))
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

  // Auth gates. The /admin check is intentionally precise (exact "/admin"
  // or "/admin/<sub>") so adjacent public routes like "/admin-preview" —
  // a read-only mock of the staff admin view used by the owner to see what
  // members will see — stay reachable without a session.
  const requiresAuth =
    path.startsWith("/app") ||
    path.startsWith("/billing") ||
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path.startsWith("/os.html");

  if (requiresAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
