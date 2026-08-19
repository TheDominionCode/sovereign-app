import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string | null) || "misc";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "no file provided" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 400 });
  }

  // Sanitise folder name so users can't escape their directory
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "misc";
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/${safeFolder}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("user-images")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("user-images").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
