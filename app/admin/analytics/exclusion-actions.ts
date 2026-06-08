"use server";

import { cookies, headers } from "next/headers";
import { requireAdmin } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";

// Mark this device as "don't count my visits" — sets a 10-year cookie that
// /api/visit reads on every incoming request to skip the insert. Persistent
// unless the admin explicitly toggles it back off OR clears site data in
// their browser. Also wipes the most recent visit row matching this IP so
// the click she just made loading the analytics page (which got counted
// before she could click the button) disappears from the count.
export async function excludeMyDeviceAction(): Promise<{ ok: true; deleted: number }> {
  await requireAdmin();

  const c = await cookies();
  c.set("sov-internal", "1", {
    maxAge: 60 * 60 * 24 * 365 * 10, // ~10 years; effectively permanent
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // the client component reads it to render the toggle state
  });

  const h = await headers();
  const ip =
    h.get("x-nf-client-connection-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;

  let deleted = 0;
  if (ip) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("clicks")
      .select("id")
      .eq("ip", ip)
      .order("clicked_at", { ascending: false })
      .limit(1);
    if (data && data[0]) {
      await admin.from("clicks").delete().eq("id", data[0].id);
      deleted = 1;
    }
  }

  return { ok: true, deleted };
}

// Start counting again on this device — clears the cookie. Doesn't restore
// any rows that were deleted by the exclude action; those are gone for good.
export async function includeMyDeviceAction(): Promise<{ ok: true }> {
  await requireAdmin();
  const c = await cookies();
  c.set("sov-internal", "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
  return { ok: true };
}
