import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// Scheduled job (every 5 minutes) — the ONLY thing that flips an
// admin-approved Daily Reset from "approved" to "published" once its
// publish_at time has arrived. Mirrors the safety rule enforced in
// app/admin/daily-reset-manager/actions.ts: a row only ever reaches this
// state because a human clicked Approve AND Schedule Publish first.
//
// This runs as a standalone Netlify Function (separate bundle from the
// Next.js app), so it uses its own Supabase service-role client rather than
// importing lib/supabase/admin.ts from the app.
export const config: Config = {
  schedule: "*/5 * * * *",
};

export default async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("publish-daily-resets: missing Supabase env vars");
    return new Response("missing env", { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("daily_resets")
    .select("id, version_number")
    .eq("status", "approved")
    .eq("admin_approved", true)
    .not("publish_at", "is", null)
    .lte("publish_at", now);

  if (error) {
    console.error("publish-daily-resets: query failed", error);
    return new Response("query failed", { status: 500 });
  }

  if (!due || due.length === 0) {
    return new Response("nothing due", { status: 200 });
  }

  for (const row of due) {
    const nextVersion = (row.version_number as number) + 1;
    const { data: updated, error: updateErr } = await supabase
      .from("daily_resets")
      .update({ status: "published", published_at: now, version_number: nextVersion })
      .eq("id", row.id)
      .eq("status", "approved") // re-check: don't publish if it was edited/unapproved since the query above
      .select("*")
      .single();

    if (updateErr || !updated) {
      console.error(`publish-daily-resets: failed to publish id=${row.id}`, updateErr);
      continue;
    }

    await supabase.from("daily_reset_versions").insert({
      daily_reset_id: row.id,
      version_number: nextVersion,
      snapshot: updated,
      change_type: "published",
      created_by: "system:scheduled-publish",
    });
  }

  return new Response(`published ${due.length}`, { status: 200 });
};
