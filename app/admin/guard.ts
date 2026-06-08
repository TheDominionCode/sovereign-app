import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type PermissionKey, hasPermission as hasPermFn } from "@/lib/admin/permissions";

export type AdminRole = "owner" | "member";
export type AdminInfo = {
  email: string;
  role: AdminRole;
  permissions: string[];
};

// Server-component / server-action guard.
// Redirects to /login if signed out, /app if signed in but not an admin.
// Returns the admin's email + role + permissions on success.
export async function requireAdmin(): Promise<AdminInfo> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/login?next=/admin");

  // Look up in admins table via the service-role client (bypasses RLS).
  const admin = createAdminClient();
  const { data } = await admin
    .from("admins")
    .select("email,role,permissions")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!data) redirect("/app");
  const role = (data.role === "owner" ? "owner" : "member") as AdminRole;
  const permissions = Array.isArray(data.permissions) ? (data.permissions as string[]) : [];
  return { email: data.email, role, permissions };
}

// Page-level guard that combines auth + permission check. Use at the top of
// every /admin/* page that's gated behind a specific permission key. Owners
// always pass; members must have the key in their permissions array.
export async function requirePermission(perm: PermissionKey): Promise<AdminInfo> {
  const me = await requireAdmin();
  if (!hasPermFn(me, perm)) redirect("/admin");
  return me;
}
