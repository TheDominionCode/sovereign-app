import { requireAdmin } from "../guard";
import { getAdmins, fmtDate, MAX_ADMINS } from "../_data";
import { addAdminAction, removeAdminAction } from "../actions";

export default async function AdminAdminsPage() {
  const me = await requireAdmin();
  const admins = await getAdmins();
  const isOwner = me.role === "owner";

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h2 className="font-display text-2xl text-forest-deep">Admins</h2>
        <p className="text-sm text-stone mt-1">
          People who can access this admin dashboard. {admins.length} of {MAX_ADMINS} seats used.
        </p>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        <div className="divide-y divide-stone-100">
          {admins.map((a) => (
            <div key={a.email} className="px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="font-medium text-ink">{a.email}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${a.role === "owner" ? "bg-forest text-white" : "bg-sage-pale/60 text-forest"}`}>
                {a.role}
              </span>
              <span className="ml-auto text-xs text-stone-light">
                added {fmtDate(a.added_at)}{a.added_by ? ` · by ${a.added_by}` : ""}
              </span>
              {isOwner && a.email !== me.email && a.role !== "owner" && (
                <form action={removeAdminAction}>
                  <input type="hidden" name="email" value={a.email} />
                  <button type="submit" className="text-xs text-stone-400 hover:text-rose-500" title="Remove admin">
                    Remove
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        {isOwner && admins.length < MAX_ADMINS && (
          <form action={addAdminAction} className="px-4 py-4 border-t border-stone-100 bg-stone-50/60 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] tracking-[0.18em] uppercase text-stone-500 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                placeholder="assistant@example.com"
                className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.18em] uppercase text-stone-500 mb-1">Role</label>
              <select
                name="role"
                defaultValue="member"
                className="rounded border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              >
                <option value="member">Member (read-only)</option>
                <option value="owner">Owner (full access)</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep transition-colors"
            >
              + Add admin
            </button>
          </form>
        )}

        {!isOwner && (
          <p className="px-4 py-3 text-xs italic text-stone border-t border-stone-100 bg-stone-50/60">
            Only owners can add or remove admins.
          </p>
        )}
      </section>

      <div className="mt-6 text-xs text-stone leading-relaxed space-y-1">
        <p>· <span className="font-medium">Owner</span> — sees everything, can add/remove other admins, manages settings.</p>
        <p>· <span className="font-medium">Member</span> — read-only access to the admin dashboard. Sees customers, revenue, trial pipeline — can&apos;t add/remove other admins.</p>
        <p>· Added admins gain access the moment they sign in with that email.</p>
      </div>
    </div>
  );
}
