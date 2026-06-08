"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMUNITY_THEMES } from "@/lib/affiliate/themes";

// Save the quote shown under "Wall of wins" and the color theme. Both fields
// are admin-only and live in community_settings as key/value rows. Validates
// the theme name is one of the known presets so a typo can't blank out the
// community page's styling.
export async function saveCommunitySettingsAction(formData: FormData) {
  const me = await requireAdmin();
  const quote = (formData.get("quote") ?? "").toString().trim().slice(0, 500);
  const themeRaw = (formData.get("theme") ?? "").toString();
  const theme = themeRaw in COMMUNITY_THEMES ? themeRaw : "sand";

  if (!quote) return;

  const now = new Date().toISOString();
  const admin = createAdminClient();
  await admin.from("community_settings").upsert(
    [
      { key: "quote", value: quote, updated_at: now, updated_by: me.email },
      { key: "theme", value: theme, updated_at: now, updated_by: me.email },
    ],
    { onConflict: "key" },
  );

  revalidatePath("/admin/community");
  revalidatePath("/affiliate/community");
}
