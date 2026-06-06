"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "../guard";

// Approve = copy the json + photo files into the `approved/` prefix and
// remove them from `pending/`. Approved testimonials are picked up by the
// public landing page.
export async function approveTestimonialAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/testimonials");

  const admin = createAdminClient();
  const bucket = admin.storage.from("testimonials");

  // List pending files matching this id (e.g. pending/<id>.json, pending/<id>.jpg)
  const { data: list } = await bucket.list("pending", { limit: 100 });
  const matches = (list ?? []).filter((f) => f.name.startsWith(id + "."));

  for (const f of matches) {
    await bucket.move(`pending/${f.name}`, `approved/${f.name}`);
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  redirect("/admin/testimonials?approved=1");
}

export async function rejectTestimonialAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/testimonials");

  const admin = createAdminClient();
  const bucket = admin.storage.from("testimonials");

  // Remove any pending files for this id.
  const { data: list } = await bucket.list("pending", { limit: 100 });
  const paths = (list ?? [])
    .filter((f) => f.name.startsWith(id + "."))
    .map((f) => `pending/${f.name}`);

  if (paths.length) await bucket.remove(paths);

  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials?rejected=1");
}

// Allow an already-approved testimonial to be revoked (moved back to pending
// or fully deleted, depending on the action).
export async function unpublishTestimonialAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/testimonials");

  const admin = createAdminClient();
  const bucket = admin.storage.from("testimonials");

  const { data: list } = await bucket.list("approved", { limit: 100 });
  const paths = (list ?? [])
    .filter((f) => f.name.startsWith(id + "."))
    .map((f) => `approved/${f.name}`);

  if (paths.length) await bucket.remove(paths);

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  redirect("/admin/testimonials?unpublished=1");
}
