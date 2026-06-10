import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Match middleware: extend Supabase auth cookies to the spec-max 400 days
// when they're set from a server action (signin / signup / OAuth callback)
// so the cookie that lands in the browser is durable from the start. We
// also force sameSite=lax + path=/ + secure (outside localhost) so OAuth
// redirects and iOS-Safari restarts don't quietly drop the cookie.
const FOUR_HUNDRED_DAYS_SECONDS = 60 * 60 * 24 * 400;
function extendAuthCookie(name: string, value: string, options?: CookieOptions): CookieOptions | undefined {
  if (!name.startsWith("sb-") || !value) return options;
  const next: CookieOptions = { ...(options || {}) };
  if (!next.maxAge || next.maxAge < FOUR_HUNDRED_DAYS_SECONDS) next.maxAge = FOUR_HUNDRED_DAYS_SECONDS;
  delete (next as { expires?: unknown }).expires;
  if (!next.sameSite) next.sameSite = "lax";
  if (!next.path) next.path = "/";
  // We don't know the request hostname here (no NextRequest in server
  // actions/components), so trust the SDK's default for `secure`. Middleware
  // re-runs on every request and will normalize it there.
  return next;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, extendAuthCookie(name, value, options))
            );
          } catch {
            // Called from a Server Component — middleware refreshes the session.
          }
        },
      },
    }
  );
}
