import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyResetRow } from "./types";

type ChangeType = "created" | "ai_generated" | "edited" | "regenerated_section" | "approved" | "scheduled" | "published" | "unpublished" | "restored";

// Applies `updates` to a daily_resets row, bumps version_number, and writes
// one daily_reset_versions row snapshotting the new state — the single
// place every mutating admin action funnels through, so version history
// can never be skipped by accident.
export async function updateWithVersion(
  admin: SupabaseClient,
  id: number,
  updates: Record<string, unknown>,
  changeType: ChangeType,
  createdBy: string | null
): Promise<DailyResetRow> {
  const { data: current, error: fetchErr } = await admin
    .from("daily_resets")
    .select("version_number")
    .eq("id", id)
    .single();
  if (fetchErr || !current) throw new Error("daily_reset_not_found");

  const nextVersion = (current.version_number as number) + 1;

  const { data: updated, error: updateErr } = await admin
    .from("daily_resets")
    .update({ ...updates, version_number: nextVersion, updated_by: createdBy })
    .eq("id", id)
    .select("*")
    .single();
  if (updateErr || !updated) throw new Error("daily_reset_update_failed");

  await admin.from("daily_reset_versions").insert({
    daily_reset_id: id,
    version_number: nextVersion,
    snapshot: updated,
    change_type: changeType,
    created_by: createdBy,
  });

  return updated as DailyResetRow;
}

// If a row is currently approved or published and its content changes,
// force it back to pending_approval (spec §10/§11) — this drops it out of
// the public feed immediately if it was already live.
export function reapprovalFields(currentStatus: string): Partial<DailyResetRow> {
  if (currentStatus === "approved" || currentStatus === "published") {
    return { status: "pending_approval", admin_approved: false, approved_by: null, approved_at: null };
  }
  return {};
}
