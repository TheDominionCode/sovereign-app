import { notFound } from "next/navigation";
import { requirePermission } from "@/app/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DailyResetRow } from "@/app/admin/daily-reset-manager/_lib/types";
import DailyResetPreviewCard from "@/app/admin/daily-reset-manager/_components/DailyResetPreviewCard";

export const dynamic = "force-dynamic";

// Deliberately OUTSIDE app/admin/ so it does not inherit the admin
// shell/nav (AdminTabs, header) — spec §12 requires this to show exactly
// what a real user sees, with zero admin controls. Still permission-gated:
// this can show unapproved/unpublished content.
const WIDTHS: Record<string, string> = {
  mobile: "390px",
  tablet: "768px",
  desktop: "100%",
};

export default async function DailyResetPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ device?: string; lang?: string }>;
}) {
  await requirePermission("daily_reset_manager");
  const { id } = await params;
  const { device, lang } = await searchParams;

  const admin = createAdminClient();
  const { data: row } = await admin.from("daily_resets").select("*").eq("id", id).single();
  if (!row) notFound();

  const width = WIDTHS[device ?? "desktop"] ?? WIDTHS.desktop;
  const activeLang = lang === "es" ? "es" : "en";

  return (
    <div className="min-h-screen bg-[#f5efe6] py-6">
      <div className="mx-auto" style={{ maxWidth: width, transition: "max-width 0.2s ease" }}>
        <div
          className="bg-[#f7faf3] rounded-lg shadow-lg overflow-hidden"
          style={{ minHeight: "80vh" }}
        >
          <DailyResetPreviewCard row={row as DailyResetRow} lang={activeLang} />
        </div>
      </div>
    </div>
  );
}
