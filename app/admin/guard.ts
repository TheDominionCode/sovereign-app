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
//
// We do TWO queries instead of one so a missing permissions column (when
// the migration hasn't run yet on this database) doesn't blow up the
// admin login flow. First check email+role (guaranteed to exist) so the
// owner can always reach /admin; THEN try permissions separately and fall
// back to '[]' on error.
export async function requireAdmin(): Promise<AdminInfo> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/login?next=/admin");

  const admin = createAdminClient();
  const email = user!.email!.toLowerCase();

  const { data } = await admin
    .from("admins")
    .select("email,role")
    .eq("email", email)
    .maybeSingle();

  if (!data) redirect("/app");
  const role = (data.role === "owner" ? "owner" : "member") as AdminRole;

  // Permissions is best-effort: missing column = []. Owner role override
  // (see hasPermission) means the owner still passes every check.
  let permissions: string[] = [];
  try {
    const permsRes = await admin
      .from("admins")
      .select("permissions")
      .eq("email", email)
      .maybeSingle();
    const raw = (permsRes.data as { permissions?: unknown } | null)?.permissions;
    if (Array.isArray(raw)) permissions = raw as string[];
  } catch {
    // Column doesn't exist yet — owner still gets through via the role check.
  }

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
