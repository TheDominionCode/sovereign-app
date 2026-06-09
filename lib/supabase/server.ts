import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Match middleware: extend Supabase auth cookies to 30 days when they're
// set from a server action (signin/signup), so the cookie that lands in
// the browser is durable from the start.
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;
function extendAuthCookie(name: string, value: string, options?: CookieOptions): CookieOptions | undefined {
  if (!name.startsWith("sb-") || !value) return options;
  const next: CookieOptions = { ...(options || {}) };
  if (!next.maxAge || next.maxAge < THIRTY_DAYS_SECONDS) next.maxAge = THIRTY_DAYS_SECONDS;
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
