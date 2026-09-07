"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateWithVersion, reapprovalFields } from "./_lib/versions";
import { sanitizeRichText } from "./_lib/sanitize";
import { generateFullReset, regenerateOneSection } from "./_lib/ai";
import { isValidSection, SECTIONS, type DailyResetRow } from "./_lib/types";

// AI SAFETY (spec §19): the two AI-driven actions below (createDraftAction's
// "generate" branch, and regenerateSectionAction) only ever write content
// columns + ai_generated/updated_by. They never set status/admin_approved/
// approved_by/approved_at/published_at — only approveAction, schedulePublishAction,
// publishNowAction, and unpublishAction (all admin-triggered) touch those.

export async function createDraftAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const admin = createAdminClient();

  const dayNumber = Number(formData.get("day_number"));
  const date = String(formData.get("date") ?? "");
  const theme = (String(formData.get("theme") ?? "").trim() || null);
  const direction = (String(formData.get("direction") ?? "").trim() || null);
  const intent = String(formData.get("intent") ?? "save"); // "save" | "generate"

  if (!dayNumber || !date) {
    redirect("/admin/daily-reset-manager?error=missing_fields");
  }

  const { data: created, error } = await admin
    .from("daily_resets")
    .insert({
      day_number: dayNumber,
      date,
      theme,
      nataly_direction: direction,
      status: "draft",
      created_by: me.email,
      updated_by: me.email,
    })
    .select("*")
    .single();

  if (error || !created) {
    redirect(`/admin/daily-reset-manager?error=${error?.code === "23505" ? "duplicate_day" : "create_failed"}`);
  }

  const row = created as DailyResetRow;

  // Version 1 is always the bare draft as created, before any AI content —
  // so a failed generation below still leaves an accurate, non-misleading
  // history entry rather than claiming content that doesn't exist.
  await admin.from("daily_reset_versions").insert({
    daily_reset_id: row.id,
    version_number: 1,
    snapshot: row,
    change_type: "created",
    created_by: me.email,
  });

  if (intent === "generate") {
    try {
      const content = await generateFullReset(admin, { dayNumber, date, theme, direction });
      const updates: Record<string, unknown> = { ai_generated: true };
      for (const s of SECTIONS) {
        updates[`${s.key}_en`] = content[s.key].en;
        updates[`${s.key}_es`] = content[s.key].es;
      }
      await updateWithVersion(admin, row.id, updates, "ai_generated", me.email);
    } catch {
      redirect(`/admin/daily-reset-manager/${row.id}?error=ai_generation_failed`);
    }
  }

  revalidatePath("/admin/daily-reset-manager");
  redirect(`/admin/daily-reset-manager/${row.id}`);
}

export async function updateSectionAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  const sectionKey = String(formData.get("sectionKey") ?? "");
  const contentEn = String(formData.get("content_en") ?? "");
  const contentEs = String(formData.get("content_es") ?? "");
  if (!id || !isValidSection(sectionKey)) return;

  const admin = createAdminClient();
  const { data: current } = await admin.from("daily_resets").select("status").eq("id", id).single();
  if (!current) return;

  await updateWithVersion(
    admin,
    id,
    {
      [`${sectionKey}_en`]: sanitizeRichText(contentEn),
      [`${sectionKey}_es`]: sanitizeRichText(contentEs),
      ...reapprovalFields(current.status),
    },
    "edited",
    me.email
  );

  revalidatePath(`/admin/daily-reset-manager/${id}`);
}

export async function updateMetaAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  if (!id) return;

  const theme = (String(formData.get("theme") ?? "").trim() || null);
  const direction = (String(formData.get("direction") ?? "").trim() || null);

  const admin = createAdminClient();
  const { data: current } = await admin.from("daily_resets").select("status").eq("id", id).single();
  if (!current) return;

  await updateWithVersion(admin, id, { theme, nataly_direction: direction, ...reapprovalFields(current.status) }, "edited", me.email);
  revalidatePath(`/admin/daily-reset-manager/${id}`);
}

export async function regenerateSectionAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  const sectionKey = String(formData.get("sectionKey") ?? "");
  const instruction = String(formData.get("instruction") ?? "").trim();
  if (!id || !isValidSection(sectionKey)) return;

  const admin = createAdminClient();
  const { data: row } = await admin.from("daily_resets").select("*").eq("id", id).single();
  if (!row) return;
  const currentRow = row as DailyResetRow;

  const section = SECTIONS.find((s) => s.key === sectionKey)!;

  try {
    const { en, es } = await regenerateOneSection(admin, {
      dayNumber: currentRow.day_number,
      date: currentRow.date,
      theme: currentRow.theme,
      sectionKey,
      sectionLabel: section.label,
      instruction: instruction || "Make this more powerful and less repetitive.",
      currentRow,
    });

    await updateWithVersion(
      admin,
      id,
      {
        [`${sectionKey}_en`]: en,
        [`${sectionKey}_es`]: es,
        ai_generated: true,
        ...reapprovalFields(currentRow.status),
      },
      "regenerated_section",
      me.email
    );
  } catch {
    redirect(`/admin/daily-reset-manager/${id}?error=ai_regenerate_failed`);
  }

  revalidatePath(`/admin/daily-reset-manager/${id}`);
}

export async function approveAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  if (!id) return;

  const admin = createAdminClient();
  await updateWithVersion(
    admin,
    id,
    { status: "approved", admin_approved: true, approved_by: me.email, approved_at: new Date().toISOString() },
    "approved",
    me.email
  );

  revalidatePath(`/admin/daily-reset-manager/${id}`);
  revalidatePath("/admin/daily-reset-manager");
}

export async function schedulePublishAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  const publishDate = String(formData.get("publish_date") ?? "");
  const publishTime = String(formData.get("publish_time") ?? "00:00");
  if (!id || !publishDate) return;

  const admin = createAdminClient();
  const { data: current } = await admin.from("daily_resets").select("status,admin_approved").eq("id", id).single();
  if (!current || current.status !== "approved" || !current.admin_approved) {
    redirect(`/admin/daily-reset-manager/${id}?error=approval_required`);
  }

  const publishAt = new Date(`${publishDate}T${publishTime}:00`).toISOString();
  await updateWithVersion(admin, id, { publish_at: publishAt }, "scheduled", me.email);

  revalidatePath(`/admin/daily-reset-manager/${id}`);
}

export async function publishNowAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  if (!id) return;

  const admin = createAdminClient();
  const { data: current } = await admin.from("daily_resets").select("status,admin_approved").eq("id", id).single();
  if (!current || current.status !== "approved" || !current.admin_approved) {
    redirect(`/admin/daily-reset-manager/${id}?error=approval_required`);
  }

  await updateWithVersion(
    admin,
    id,
    { status: "published", published_at: new Date().toISOString() },
    "published",
    me.email
  );

  revalidatePath(`/admin/daily-reset-manager/${id}`);
  revalidatePath("/admin/daily-reset-manager");
}

export async function unpublishAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  if (!id) return;

  const admin = createAdminClient();
  const { data: current } = await admin.from("daily_resets").select("status").eq("id", id).single();
  if (!current || current.status !== "published") return;

  await updateWithVersion(admin, id, { status: "archived" }, "unpublished", me.email);

  revalidatePath(`/admin/daily-reset-manager/${id}`);
  revalidatePath("/admin/daily-reset-manager");
}

export async function restoreVersionAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  const versionId = Number(formData.get("versionId"));
  if (!id || !versionId) return;

  const admin = createAdminClient();
  const { data: version } = await admin
    .from("daily_reset_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("daily_reset_id", id)
    .single();
  if (!version) return;

  const snap = version.snapshot as DailyResetRow;
  const restoredFields: Record<string, unknown> = { theme: snap.theme, nataly_direction: snap.nataly_direction };
  for (const s of SECTIONS) {
    restoredFields[`${s.key}_en`] = snap[`${s.key}_en` as keyof DailyResetRow];
    restoredFields[`${s.key}_es`] = snap[`${s.key}_es` as keyof DailyResetRow];
  }

  // Restoring is always a content change — always requires fresh approval,
  // regardless of what status the row is currently in.
  await updateWithVersion(
    admin,
    id,
    { ...restoredFields, status: "pending_approval", admin_approved: false, approved_by: null, approved_at: null },
    "restored",
    me.email
  );

  revalidatePath(`/admin/daily-reset-manager/${id}`);
  redirect(`/admin/daily-reset-manager/${id}`);
}
