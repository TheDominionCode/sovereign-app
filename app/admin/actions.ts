"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "./guard";

const MAX_ADMINS = 5;

// Valid permission keys — kept in sync with lib/admin/permissions.ts.
// Anything else in the submitted form is silently ignored so a tampered
// request can't grant an arbitrary capability.
const VALID_PERMS = new Set([
  "overview", "active", "trial", "access", "canceled",
  "revenue", "analytics", "affiliates", "community",
  "testimonials", "admins",
]);

function parsePermissionsFromForm(formData: FormData): string[] {
  const perms = new Set<string>();
  for (const value of formData.getAll("permissions")) {
    const s = String(value);
    if (VALID_PERMS.has(s)) perms.add(s);
  }
  return Array.from(perms);
}

export async function addAdminAction(formData: FormData) {
  const me = await requireAdmin();
  if (me.role !== "owner") return; // member can't add

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member").toLowerCase();
  if (!email || !["owner", "member"].includes(role)) return;

  const admin = createAdminClient();
  const { count } = await admin
    .from("admins")
    .select("email", { count: "exact", head: true });
  if ((count ?? 0) >= MAX_ADMINS) return;

  // Owners get the 'all' marker so legacy paths treat them right; members get
  // exactly the checkboxes that were ticked. Adding without any permissions
  // ticked is allowed — the member just sees nothing until you grant them
  // something via the per-row edit form.
  const permissions = role === "owner" ? ["all"] : parsePermissionsFromForm(formData);

  await admin.from("admins").upsert(
    { email, role, added_by: me.email, permissions },
    { onConflict: "email" }
  );
  revalidatePath("/admin/admins");
}

// Update the permissions array on an existing member admin. Owner-only.
// The role is intentionally NOT mutable here — flipping someone between
// owner ↔ member is a bigger deal and we want it to require an explicit
// separate action down the road. For now this just updates the checkboxes.
export async function setAdminPermissionsAction(formData: FormData) {
  const me = await requireAdmin();
  if (me.role !== "owner") return;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;
  // Never let the owner accidentally wipe her own permissions row — owners
  // are protected by the role-based override but we skip the write anyway
  // to keep the audit history clean.
  if (email === me.email) {
    revalidatePath("/admin/admins");
    return;
  }

  const permissions = parsePermissionsFromForm(formData);
  const admin = createAdminClient();
  await admin.from("admins").update({ permissions }).eq("email", email);
  revalidatePath("/admin/admins");
}

export async function removeAdminAction(formData: FormData) {
  const me = await requireAdmin();
  if (me.role !== "owner") return;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;
  // Don't allow removing yourself (avoid locking out the owner).
  if (email === me.email) return;

  const admin = createAdminClient();
  await admin.from("admins").delete().eq("email", email);
  revalidatePath("/admin");
}

// Grant a tester free access without a Stripe subscription by stamping
// profile.beta_until. The subscription gate in lib/billing/subscription.ts
// honors this: anyone with beta_until > now() passes through.
export async function grantAccessUntilAction(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("user_id") ?? "").trim();
  const untilRaw = String(formData.get("until") ?? "").trim();
  if (!userId || !untilRaw) {
    redirect("/admin/access?error=missing");
  }

  // Accept either an ISO timestamp or a YYYY-MM-DD date. For a plain date,
  // anchor to 23:59:59 UTC so "until Friday" means end-of-day, not midnight.
  let untilIso: string;
  if (/^\d{4}-\d{2}-\d{2}$/.test(untilRaw)) {
    untilIso = `${untilRaw}T23:59:59.000Z`;
  } else {
    const d = new Date(untilRaw);
    if (Number.isNaN(d.getTime())) {
      redirect("/admin/access?error=baddate");
    }
    untilIso = d.toISOString();
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ beta_until: untilIso })
    .eq("id", userId);

  revalidatePath("/admin/access");
  revalidatePath("/admin/trial");
  if (error) {
    redirect(`/admin/access?error=${encodeURIComponent(error.message)}`);
  }
  // Redirect with the granted-until date so the page can show a confirmation
  // banner — and crucially forces a fresh server render (no router cache).
  redirect(`/admin/access?granted=${encodeURIComponent(untilIso)}`);
}

export async function revokeAccessAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) redirect("/admin/access");

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ beta_until: null })
    .eq("id", userId);
  revalidatePath("/admin/access");
  revalidatePath("/admin/trial");
  if (error) {
    redirect(`/admin/access?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/admin/access?revoked=1");
}
