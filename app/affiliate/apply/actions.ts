"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Submit (or re-submit) an affiliate application. Requires the visitor to be
// signed in. Inserts a pending row, or updates an existing row back to pending
// if they're re-applying after a rejection. Never sets the row to approved on
// its own — only the admin moderation page can flip that.
export async function applyToAffiliateAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login?next=/affiliate/apply");
  }

  const message = (formData.get("message") ?? "").toString().trim().slice(0, 2000);

  const admin = createAdminClient();
  await admin
    .from("affiliate_applications")
    .upsert(
      {
        user_id: user!.id,
        email: user!.email!,
        message: message || null,
        status: "pending",
        applied_at: new Date().toISOString(),
        decided_at: null,
        decided_by: null,
      },
      { onConflict: "user_id" },
    );

  revalidatePath("/affiliate/apply");
  redirect("/affiliate/apply?submitted=1");
}
