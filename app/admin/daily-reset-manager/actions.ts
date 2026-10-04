"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateWithVersion, reapprovalFields } from "./_lib/versions";
import { sanitizeRichText } from "./_lib/sanitize";
import { generateFullReset, regenerateOneSection } from "./_lib/ai";
import { dayMetaForDate } from "./_lib/season";
import { isValidSection, sectionByKey, SECTIONS, type DailyResetRow } from "./_lib/types";

// AI SAFETY (spec §19/§34): generateFullReset/regenerateOneSection only ever
// return content-column values. The actions below are the only place those
// values get written, and even here they're combined ONLY with
// ai_generated/admin_edited/updated_by — never status/admin_approved/
// approved_by/approved_at/published_at. Only approveAction,
// schedulePublishAction, publishNowAction, and unpublishAction (all
// admin-triggered) touch those.

function extractGenerated(fields: Record<string, string>) {
  const { days_remaining, season, _needsReview, ...content } = fields;
  return {
    content,
    days_remaining: days_remaining !== undefined ? Number(days_remaining) : undefined,
    season,
    needs_review: _needsReview === "true",
  };
}

export async function createDraftAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const admin = createAdminClient();

  const date = String(formData.get("date") ?? "");
  const theme = (String(formData.get("theme") ?? "").trim() || null);
  const direction = (String(formData.get("direction") ?? "").trim() || null);
  const intent = String(formData.get("intent") ?? "save"); // "save" | "generate"

  if (!date) {
    redirect("/admin/daily-reset-manager?error=missing_fields");
  }

  // day_number/days_remaining/season are always computed from the date
  // (spec §30/§31) — never admin-typed.
  const { dayOfYear, daysRemaining, season } = dayMetaForDate(date);

  const { data: created, error } = await admin
    .from("daily_resets")
    .insert({
      day_number: dayOfYear,
      date,
      theme,
      nataly_direction: direction,
      days_remaining: daysRemaining,
      season: season.name,
      status: "draft",
      created_by: me.email,
      updated_by: me.email,
    })
    .select("*")
    .single();

  if (error || !created) {
    redirect(`/admin/daily-reset-manager?error=${error?.code === "23505" ? "duplicate_date" : "create_failed"}`);
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
      const generated = await generateFullReset(admin, { date, theme, direction });
      const { content, needs_review } = extractGenerated(generated);
      await updateWithVersion(admin, row.id, { ...content, ai_generated: true, needs_review }, "ai_generated", me.email);
    } catch {
      redirect(`/admin/daily-reset-manager/${row.id}?error=ai_generation_failed`);
    }
  }

  revalidatePath("/admin/daily-reset-manager");
  redirect(`/admin/daily-reset-manager/${row.id}`);
}

// "Generate Today" (spec §38) — the admin's manual-trigger equivalent of
// the scheduled Edge Function. Idempotent: if today's row already exists,
// never silently overwrites it — sends the admin to it with a flag the
// detail page uses to show the "already exists / regenerate?" prompt.
export async function generateTodayAction(): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await admin.from("daily_resets").select("id").eq("date", today).maybeSingle();
  if (existing) {
    redirect(`/admin/daily-reset-manager/${existing.id}?alreadyExists=1`);
  }

  const { dayOfYear, daysRemaining, season } = dayMetaForDate(today);
  const { data: created, error } = await admin
    .from("daily_resets")
    .insert({
      day_number: dayOfYear,
      date: today,
      days_remaining: daysRemaining,
      season: season.name,
      status: "draft",
      created_by: me.email,
      updated_by: me.email,
    })
    .select("*")
    .single();
  if (error || !created) redirect("/admin/daily-reset-manager?error=create_failed");

  const row = created as DailyResetRow;
  await admin.from("daily_reset_versions").insert({
    daily_reset_id: row.id, version_number: 1, snapshot: row, change_type: "created", created_by: me.email,
  });

  try {
    const generated = await generateFullReset(admin, { date: today, theme: null, direction: null });
    const { content, needs_review } = extractGenerated(generated);
    await updateWithVersion(admin, row.id, { ...content, ai_generated: true, needs_review }, "ai_generated", me.email);
  } catch {
    redirect(`/admin/daily-reset-manager/${row.id}?error=ai_generation_failed`);
  }

  revalidatePath("/admin/daily-reset-manager");
  redirect(`/admin/daily-reset-manager/${row.id}`);
}

// Regenerates every AI-driven field for the day in one call (spec §39).
// Per-section edit protection: a section the admin has hand-edited
// (admin_edited_sections) is skipped unless replaceEdited=1 was passed —
// the UI only sends that after showing the confirmation copy.
export async function regenerateEntireDayAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  const replaceEdited = formData.get("replaceEdited") === "1";
  if (!id) return;

  const admin = createAdminClient();
  const { data: row } = await admin.from("daily_resets").select("*").eq("id", id).single();
  if (!row) return;
  const currentRow = row as DailyResetRow;

  try {
    const generated = await generateFullReset(admin, { date: currentRow.date, theme: currentRow.theme, direction: currentRow.nataly_direction });
    const { content, days_remaining, season, needs_review } = extractGenerated(generated);

    const editedSections: string[] = Array.isArray(currentRow.admin_edited_sections) ? currentRow.admin_edited_sections : [];
    const finalContent: Record<string, unknown> = { ...content };
    // Drop columns belonging to a protected (hand-edited) section unless
    // the admin explicitly confirmed "replace anyway".
    if (!replaceEdited && editedSections.length > 0) {
      for (const key of editedSections) {
        const section = SECTIONS.find((s) => s.key === key);
        if (!section) continue;
        for (const f of section.fields) delete finalContent[f.column];
      }
    }

    await updateWithVersion(
      admin,
      id,
      {
        ...finalContent,
        days_remaining,
        season,
        needs_review,
        ai_generated: true,
        admin_edited_sections: replaceEdited ? [] : editedSections,
        admin_edited: replaceEdited ? false : editedSections.length > 0,
        ...reapprovalFields(currentRow.status),
      },
      "regenerated_section",
      me.email
    );
  } catch {
    redirect(`/admin/daily-reset-manager/${id}?error=ai_generation_failed`);
  }

  revalidatePath(`/admin/daily-reset-manager/${id}`);
}

export async function updateSectionAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  const sectionKey = String(formData.get("sectionKey") ?? "");
  if (!id || !isValidSection(sectionKey)) return;
  const section = sectionByKey(sectionKey)!;

  const admin = createAdminClient();
  const { data: current } = await admin.from("daily_resets").select("status,admin_edited_sections").eq("id", id).single();
  if (!current) return;

  const updates: Record<string, unknown> = { ...reapprovalFields(current.status) };
  for (const f of section.fields) {
    const raw = String(formData.get(`field_${f.column}`) ?? "");
    updates[f.column] = f.kind === "richtext" ? sanitizeRichText(raw) : raw.trim();
  }

  const editedSections: string[] = Array.isArray(current.admin_edited_sections) ? current.admin_edited_sections : [];
  if (!editedSections.includes(sectionKey)) editedSections.push(sectionKey);
  updates.admin_edited_sections = editedSections;
  updates.admin_edited = true;

  await updateWithVersion(admin, id, updates, "edited", me.email);
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
  const section = sectionByKey(sectionKey)!;

  try {
    const fields = await regenerateOneSection(admin, {
      date: currentRow.date,
      theme: currentRow.theme,
      sectionKey,
      sectionLabel: section.label,
      instruction: instruction || "Make this more powerful and less repetitive.",
      currentRow,
    });

    const editedSections: string[] = (Array.isArray(currentRow.admin_edited_sections) ? currentRow.admin_edited_sections : [])
      .filter((k) => k !== sectionKey); // AI regenerated it, so it's no longer "hand-edited"

    await updateWithVersion(
      admin,
      id,
      {
        ...fields,
        ai_generated: true,
        admin_edited_sections: editedSections,
        admin_edited: editedSections.length > 0,
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

export async function archiveAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const id = Number(formData.get("id"));
  if (!id) return;

  const admin = createAdminClient();
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
  for (const section of SECTIONS) {
    for (const f of section.fields) {
      restoredFields[f.column] = snap[f.column as keyof DailyResetRow];
    }
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

export async function updateAppSettingAction(formData: FormData): Promise<void> {
  const me = await requirePermission("daily_reset_manager");
  const key = String(formData.get("key") ?? "");
  const rawValue = formData.get("value");
  if (!key) return;

  // Checkbox-style booleans arrive only when checked; absence means false.
  const isBoolean = formData.get("type") === "boolean";
  const value = isBoolean ? rawValue === "true" : String(rawValue ?? "");

  const admin = createAdminClient();
  await admin.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString(), updated_by: me.email });

  revalidatePath("/admin/daily-reset-manager/settings");
}
