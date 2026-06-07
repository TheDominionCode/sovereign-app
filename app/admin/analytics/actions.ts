"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";

// One-shot reset for the analytics dashboard. Wipes every row from the
// clicks table so the admin can start counting cleanly from "now" — most
// useful right after setting the "Don't count my visits" cookie on her
// devices, when she wants the leftover rows from earlier testing gone.
//
// Guarded by requireAdmin(); the layout's gating already prevents non-admin
// users from reaching anything that imports this, but we double-check at the
// action so the service-role delete is never reachable by accident.
export async function clearAllVisitsAction() {
  await requireAdmin();
  const admin = createAdminClient();
  // .neq("id", 0) is the Supabase idiom for "delete every row" — a bare
  // .delete() without a filter is rejected by the client.
  await admin.from("clicks").delete().neq("id", 0);
  revalidatePath("/admin/analytics");
}
