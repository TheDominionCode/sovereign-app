import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "owner" | "member";
export type AdminInfo = { email: string; role: AdminRole };

// Server-component / server-action guard.
// Redirects to /login if signed out, /app if signed in but not an admin.
// Returns the admin's email + role on success.
export async function requireAdmin(): Promise<AdminInfo> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/login?next=/admin");

  // Look up in admins table via the service-role client (bypasses RLS).
  const admin = createAdminClient();
  const { data } = await admin
    .from("admins")
    .select("email,role")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!data) redirect("/app");
  const role = (data.role === "owner" ? "owner" : "member") as AdminRole;
  return { email: data.email, role };
}
