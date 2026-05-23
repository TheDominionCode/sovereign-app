import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The Sovereign app itself is the exact self-contained build shipped at
// sovereignincharge.netlify.app, served as a static asset from /os.html.
// Access is gated upstream by app/(authed)/layout.tsx, which enforces login
// and an active subscription before this page ever renders.
//
// When the signed-in user is on the admins allow-list we pass ?admin=1 to
// the iframe — os.html's ProfileAvatar dropdown reads that flag and adds an
// "Admin dashboard" entry below the profile picture options. Non-admin
// customers don't see the option.
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

  return (
    <iframe
      src={isAdmin ? "/os.html?admin=1" : "/os.html"}
      title="Sovereign"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
      }}
    />
  );
}
