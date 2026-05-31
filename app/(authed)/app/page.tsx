import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Top-level redirect to the standalone Sovereign app at /os.html.
//
// We used to iframe /os.html here, but iOS Safari's Intelligent Tracking
// Prevention treats iframes as third-party contexts and silently blocks
// session cookies — which left iPhone users staring at a blank screen while
// the app inside the iframe waited forever on auth'd API calls.
//
// Top-level navigation keeps cookies first-party and works in every browser.
// Auth is still enforced upstream by app/(authed)/layout.tsx
// (requireActiveSubscription) before this redirect runs, and the middleware
// requires auth for any GET on /os.html.
//
// The admin allow-list flag (?admin=1) is preserved so the in-app
// ProfileAvatar dropdown can show the Admin dashboard link for staff.
export default async function AppHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user?.email) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("admins")
        .select("email")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();
      isAdmin = !!data;
    } catch {
      isAdmin = false;
    }
  }
  redirect(isAdmin ? "/os.html?admin=1" : "/os.html");
}
