"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// Shape we return to the landing page for an approved testimonial.
export type ApprovedTestimonial = {
  id: string;
  name: string;
  quote: string;
  lang: string;
  photoUrl: string | null;
  createdAt: string;
};

// Public list of approved testimonials. The landing page calls this on
// mount to populate the "reviews" section instead of the old hardcoded set.
export async function listApprovedTestimonials(): Promise<ApprovedTestimonial[]> {
  const admin = createAdminClient();
  const bucket = admin.storage.from("testimonials");
  const { data: files } = await bucket.list("approved", {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (!files) return [];

  const jsonFiles = files.filter((f) => f.name.endsWith(".json"));
  const items = await Promise.all(
    jsonFiles.map(async (f): Promise<ApprovedTestimonial | null> => {
      const { data, error } = await bucket.download(`approved/${f.name}`);
      if (error || !data) return null;
      try {
        const meta = JSON.parse(await data.text());
        let photoUrl: string | null = null;
        if (meta.photo_path) {
          const photoName = meta.photo_path.split("/").pop();
          const { data: pub } = bucket.getPublicUrl(`approved/${photoName}`);
          photoUrl = pub.publicUrl;
        }
        return {
          id: meta.id,
          name: meta.name,
          quote: meta.quote,
          lang: meta.lang || "en",
          photoUrl,
          createdAt: meta.created_at,
        };
      } catch {
        return null;
      }
    })
  );
  return items.filter(Boolean) as ApprovedTestimonial[];
}

// Submission shape returned to the client component.
export type SubmitTestimonialState = { ok: boolean; error?: string };

// Public testimonial submission — anyone on the landing page can submit a
// short quote + optional photo. Files land in the "pending/" prefix of the
// public "testimonials" bucket; admin moderates from /admin and moves the
// approved ones onto the marketing page.
export async function submitTestimonialAction(
  _prev: SubmitTestimonialState,
  formData: FormData
): Promise<SubmitTestimonialState> {
  const name = String(formData.get("name") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const lang = String(formData.get("lang") ?? "en").trim();
  const photo = formData.get("photo");

  if (!name) return { ok: false, error: "Please add your name." };
  if (!quote || quote.length < 20) {
    return { ok: false, error: "Tell us a little more — at least 20 characters." };
  }
  if (quote.length > 600) {
    return { ok: false, error: "Please keep it under 600 characters." };
  }

  const admin = createAdminClient();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Optional photo. We accept jpeg/png/webp/heic up to ~5 MB; anything else
  // is silently skipped so the testimonial still gets recorded.
  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0 && photo.size <= 5 * 1024 * 1024) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (allowed.includes(photo.type)) {
      const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
      photoPath = `pending/${id}.${ext}`;
      const { error: upErr } = await admin.storage
        .from("testimonials")
        .upload(photoPath, photo, {
          contentType: photo.type,
          upsert: false,
        });
      if (upErr) {
        return { ok: false, error: "Photo upload failed. Try a smaller image." };
      }
    }
  }

  const meta = {
    id,
    name,
    quote,
    lang,
    photo_path: photoPath,
    created_at: new Date().toISOString(),
  };
  const metaBlob = new Blob([JSON.stringify(meta, null, 2)], {
    type: "application/json",
  });
  const { error: metaErr } = await admin.storage
    .from("testimonials")
    .upload(`pending/${id}.json`, metaBlob, {
      contentType: "application/json",
      upsert: false,
    });

  if (metaErr) {
    return { ok: false, error: "Couldn't save your testimonial. Try again." };
  }

  return { ok: true };
}
