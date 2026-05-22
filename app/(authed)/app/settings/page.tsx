import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { UserPreferencesRow } from "@/lib/dashboard/types";
import { PageHeader, Panel } from "../_components/ui";
import { ImagePicker } from "../vision/_components/image-picker";
import { removeInspiration, savePreferences, setInspiration } from "./actions";

const sel = "px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white";

export default async function SettingsPage() {
  const user = await requireActiveSubscription();
  const supabase = await createClient();
  const { data } = await supabase.from("user_preferences").select("*").maybeSingle();
  const p = (data as UserPreferencesRow | null) ?? null;

  const accents = ["sage", "rose", "lavender", "honey", "ocean", "noir"];
  const currencies = ["$", "€", "£", "¥", "C$", "A$"];

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <PageHeader title="Settings" subtitle="Preferences, account, and your space." />

      <Panel title="Preferences" className="mb-5">
        <form action={savePreferences} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-stone">
              Accent
              <select name="accent" defaultValue={p?.accent ?? "sage"} className={`mt-1 w-full ${sel}`}>
                {accents.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="text-sm text-stone">
              Language
              <select name="lang" defaultValue={p?.lang ?? "en"} className={`mt-1 w-full ${sel}`}>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </label>
            <label className="text-sm text-stone">
              Week starts on
              <select name="week_start" defaultValue={p?.week_start ?? "Monday"} className={`mt-1 w-full ${sel}`}>
                <option>Monday</option>
                <option>Sunday</option>
              </select>
            </label>
            <label className="text-sm text-stone">
              Currency
              <select name="currency" defaultValue={p?.currency ?? "$"} className={`mt-1 w-full ${sel}`}>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label className="text-sm text-stone">
            Calendar label
            <input name="calendar_label" defaultValue={p?.calendar_label ?? "Calendar"} className={`mt-1 w-full ${sel}`} />
          </label>
          <label className="flex items-center justify-between gap-4 p-3 rounded border border-stone-200">
            <span className="text-sm text-ink">Daily reminder</span>
            <input type="checkbox" name="notify_daily" defaultChecked={p?.notify_daily ?? true} className="accent-sage w-4 h-4" />
          </label>
          <label className="flex items-center justify-between gap-4 p-3 rounded border border-stone-200">
            <span className="text-sm text-ink">Milestone celebrations</span>
            <input type="checkbox" name="notify_milestones" defaultChecked={p?.notify_milestones ?? true} className="accent-sage w-4 h-4" />
          </label>
          <label className="flex items-center justify-between gap-4 p-3 rounded border border-stone-200">
            <span className="text-sm text-ink">Show calendar year view</span>
            <input type="checkbox" name="show_year_view" defaultChecked={p?.show_year_view ?? true} className="accent-sage w-4 h-4" />
          </label>
          <label className="flex items-center justify-between gap-4 p-3 rounded border border-stone-200">
            <span className="text-sm text-ink">Show weekly schedule</span>
            <input type="checkbox" name="show_weekly_schedule" defaultChecked={p?.show_weekly_schedule ?? true} className="accent-sage w-4 h-4" />
          </label>
          <button type="submit" className="self-start px-4 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest">
            Save preferences
          </button>
        </form>
      </Panel>

      <Panel title="Your 'my why' photo" className="mb-5">
        {p?.inspiration_img ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.inspiration_img} alt="my why" className="w-full max-h-64 object-cover rounded border border-stone-200" />
            <form action={removeInspiration}>
              <button type="submit" className="px-3 py-1.5 text-xs border border-stone-200 rounded hover:border-rose hover:text-rose text-stone">
                Remove photo
              </button>
            </form>
          </div>
        ) : (
          <form action={setInspiration} className="grid gap-3 max-w-sm">
            <ImagePicker name="inspiration_img" />
            <button type="submit" className="self-start px-4 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest">
              Save photo
            </button>
          </form>
        )}
      </Panel>

      <Panel title="Account">
        <div className="space-y-3 text-sm">
          <div className="text-stone">
            Signed in as <span className="text-ink font-medium">{user.email}</span>
          </div>
          <div className="flex gap-2">
            <Link href="/billing" className="px-4 py-2 border border-stone-200 rounded hover:border-sage text-stone">
              Manage billing
            </Link>
            <form action="/logout" method="POST">
              <button type="submit" className="px-4 py-2 border border-stone-200 rounded hover:border-rose hover:text-rose text-stone">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </Panel>
    </div>
  );
}
