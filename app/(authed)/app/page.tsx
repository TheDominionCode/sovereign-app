import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The Sovereign app itself is the exact self-contained build shipped at
// sovereignincharge.netlify.app, served as a static asset from /os.html.
// Access is gated upstream by app/(authed)/layout.tsx, which enforces login
// and an active subscription before this page ever renders.
//
// We also overlay a small "Admin" pill at the top-right *only for admins*, so
// the owner / assistants can jump back to the admin dashboard from their own
// personal workspace.
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
      // Admins table may not exist yet in some environments — fail closed.
      isAdmin = false;
    }
  }

  return (
    <>
      <iframe
        src="/os.html"
        title="Sovereign"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
      {isAdmin && (
        <a
          href="/admin"
          title="Open the admin dashboard"
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 50,
            padding: "6px 12px",
            borderRadius: 9999,
            background: "#3d5c34",
            color: "#f1ebda",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textDecoration: "none",
            boxShadow: "0 2px 6px rgba(61, 92, 52, 0.25)",
          }}
        >
          ← Admin
        </a>
      )}
    </>
  );
}
