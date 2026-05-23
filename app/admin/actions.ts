"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "./guard";

const MAX_ADMINS = 5;

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

  await admin.from("admins").upsert(
    { email, role, added_by: me.email },
    { onConflict: "email" }
  );
  revalidatePath("/admin");
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
