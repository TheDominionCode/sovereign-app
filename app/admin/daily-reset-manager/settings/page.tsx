import Link from "next/link";
import { requirePermission } from "../../guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateAppSettingAction } from "../actions";

export const dynamic = "force-dynamic";

type SettingsMap = Record<string, unknown>;

export default async function DailyContentSettingsPage() {
  await requirePermission("daily_reset_manager");

  const admin = createAdminClient();
  const { data } = await admin.from("app_settings").select("key,value");
  const settings: SettingsMap = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));

  const autoPublish = settings.daily_content_auto_publish === true;
  const generationEnabled = settings.daily_generation_enabled !== false; // default true
  const translation = (settings.default_scripture_translation as string) || "NASB";
  const aiModel = (settings.default_ai_model as string) || "claude-sonnet-5";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/daily-reset-manager" className="text-xs text-stone-400 hover:text-[#7a9a6e]">← Daily Reset Manager</Link>
        <h1 className="text-xl font-semibold text-stone-800 mt-2">Daily AI Content Settings</h1>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-stone-800">AUTO-PUBLISH DAILY AI CONTENT</div>
            <p className="text-xs text-stone-500 mt-1 max-w-md">
              When disabled, newly generated daily content remains a draft until an admin reviews and publishes it.
            </p>
          </div>
          <form action={updateAppSettingAction}>
            <input type="hidden" name="key" value="daily_content_auto_publish" />
            <input type="hidden" name="type" value="boolean" />
            <input type="hidden" name="value" value={autoPublish ? "false" : "true"} />
            <button type="submit"
              className={`px-4 py-2 text-xs font-bold rounded-full ${autoPublish ? "bg-[#5b7351] text-white" : "bg-stone-100 text-stone-500 border border-stone-300"}`}>
              {autoPublish ? "ON" : "OFF"}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-stone-800">DAILY GENERATION</div>
            <p className="text-xs text-stone-500 mt-1 max-w-md">
              Whether the scheduled job is allowed to generate today&apos;s content automatically. Turn off to pause automation without deleting it.
            </p>
          </div>
          <form action={updateAppSettingAction}>
            <input type="hidden" name="key" value="daily_generation_enabled" />
            <input type="hidden" name="type" value="boolean" />
            <input type="hidden" name="value" value={generationEnabled ? "false" : "true"} />
            <button type="submit"
              className={`px-4 py-2 text-xs font-bold rounded-full ${generationEnabled ? "bg-[#5b7351] text-white" : "bg-stone-100 text-stone-500 border border-stone-300"}`}>
              {generationEnabled ? "ENABLED" : "DISABLED"}
            </button>
          </form>
        </div>
      </div>

      <form action={updateAppSettingAction} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
        <input type="hidden" name="key" value="default_scripture_translation" />
        <div className="text-sm font-semibold text-stone-800">DEFAULT SCRIPTURE TRANSLATION</div>
        <input type="text" name="value" defaultValue={translation}
          className="w-full sm:w-48 px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
        <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: "#5b7351" }}>Save</button>
      </form>

      <form action={updateAppSettingAction} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
        <input type="hidden" name="key" value="default_ai_model" />
        <div className="text-sm font-semibold text-stone-800">DEFAULT AI MODEL</div>
        <input type="text" name="value" defaultValue={aiModel}
          className="w-full sm:w-64 px-3 py-2 text-sm rounded border border-stone-200 focus:border-[#7a9a6e] outline-none" />
        <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded text-white" style={{ backgroundColor: "#5b7351" }}>Save</button>
      </form>
    </div>
  );
}
