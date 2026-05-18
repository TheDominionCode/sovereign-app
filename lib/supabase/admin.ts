import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS. Import ONLY from server-only code paths
// that absolutely need it (the Stripe webhook). Never import from a client
// component, a server component that renders client output, or middleware.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
