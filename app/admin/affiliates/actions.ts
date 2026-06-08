"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";

// Approve or reject an affiliate application. Stores the deciding admin's
// email + timestamp on the row for an audit trail. Approved affiliates can
// immediately reach /affiliate/community next time they load the page.
export async function decideApplicationAction(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  const decision = (formData.get("decision") ?? "").toString();
  if (!id || (decision !== "approved" && decision !== "rejected")) return;

  const admin = createAdminClient();
  await admin
    .from("affiliate_applications")
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      decided_by: me.email,
    })
    .eq("id", id);

  revalidatePath("/admin/affiliates");
}
