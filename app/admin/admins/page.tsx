import { requirePermission } from "../guard";
import { getAdmins, fmtDate, MAX_ADMINS } from "../_data";
import {
  addAdminAction,
  removeAdminAction,
  setAdminPermissionsAction,
} from "../actions";
import { GROUP_LABELS, PERMISSIONS, type PermissionGroup } from "@/lib/admin/permissions";

// Group the permission rows together so the picker reads as
// "Customers | Money | Growth | Permissions" instead of a flat list of 11.
const PERMISSIONS_BY_GROUP = PERMISSIONS.reduce<
  Record<PermissionGroup, typeof PERMISSIONS>
>((acc, p) => {
  (acc[p.group] ||= []).push(p);
  return acc;
}, { customers: [], money: [], growth: [], people: [] });

// Reusable checkbox grid. Used both inside the "add admin" form and the
// per-row "edit permissions" form. Each form posts a list of "permissions"
// values that the server action validates against the allowlist.
function PermissionsGrid({
  selected,
  disabled,
  idPrefix,
}: {
  selected: Set<string>;
  disabled?: boolean;
  idPrefix: string;
}) {
  return (
    <div className="space-y-5">
      {(Object.keys(PERMISSIONS_BY_GROUP) as PermissionGroup[]).map((group) => (
        <div key={group}>
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-2">
            {GROUP_LABELS[group]}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {PERMISSIONS_BY_GROUP[group].map((p) => {
              const id = `${idPrefix}-${p.key}`;
              const isChecked = selected.has(p.key);
              return (
                <label
                  key={p.key}
                  htmlFor={id}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                    isChecked
                      ? "border-[#5b7351] bg-[#f4f7ee]/70"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <input
                    id={id}
                    type="checkbox"
                    name="permissions"
                    value={p.key}
                    defaultChecked={isChecked}
                    disabled={disabled}
                    className="mt-1 w-4 h-4 accent-[#5b7351]"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="text-sm text-stone-800 block font-medium">{p.label}</span>
                    <span className="text-[10px] italic text-stone-500 block leading-snug">{p.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminAdminsPage() {
  const me = await requirePermission("admins");
  const admins = await getAdmins();
  const isOwner = me.role === "owner";

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="font-display text-2xl text-forest-deep">Admins</h2>
        <p className="text-sm text-stone mt-1">
          {admins.length} of {MAX_ADMINS} seats used.{" "}
          {isOwner
            ? "Add a staff admin below and check exactly which sections they can see."
            : "Only the owner can add or edit admins."}
        </p>
      </div>

      {/* EXISTING ADMINS — each member admin has an inline collapsible edit form */}
      <section className="space-y-4">
        {admins.map((a) => {
          const isMe = a.email === me.email;
          const isOwnerRow = a.role === "owner";
          const selected = new Set<string>(a.permissions ?? []);
          return (
            <div key={a.email} className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3 flex-wrap border-b border-stone-100">
                <span className="font-medium text-ink">{a.email}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                    isOwnerRow ? "bg-forest text-white" : "bg-sage-pale/60 text-forest"
                  }`}
                >
                  {a.role}
                </span>
                {isMe && (
                  <span className="text-[10px] uppercase tracking-wider text-stone-500">
                    that&apos;s you
                  </span>
                )}
                <span className="ml-auto text-xs text-stone-light">
                  added {fmtDate(a.added_at)}
                  {a.added_by ? ` · by ${a.added_by}` : ""}
                </span>
                {isOwner && !isMe && !isOwnerRow && (
                  <form action={removeAdminAction}>
                    <input type="hidden" name="email" value={a.email} />
                    <button
                      type="submit"
                      className="text-xs text-stone-400 hover:text-rose-500"
                      title="Remove admin"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </div>

              {/* Owners always have full access — no checkbox grid for them */}
              {isOwnerRow ? (
                <div className="px-5 py-4 text-xs italic text-stone-500">
                  Owners always have access to everything. No per-section toggles apply.
                </div>
              ) : (
                <form action={setAdminPermissionsAction} className="px-5 py-5 space-y-4">
                  <input type="hidden" name="email" value={a.email} />
                  <PermissionsGrid
                    selected={selected}
                    disabled={!isOwner}
                    idPrefix={`edit-${a.email}`}
                  />
                  {isOwner && (
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
                      <span className="text-xs italic text-stone-500">
                        Changes apply on their next page load.
                      </span>
                      <button
                        type="submit"
                        className="rounded-md bg-[#5b7351] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a5e42] transition-colors"
                      >
                        Save permissions
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          );
        })}
      </section>

      {/* ADD A NEW ADMIN — owner-only, with checkbox grid */}
      {isOwner && admins.length < MAX_ADMINS && (
        <section className="rounded-xl border border-stone-200 bg-stone-50/60 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 bg-stone-100/50">
            <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold">
              Add a staff admin
            </div>
          </div>
          <form action={addAdminAction} className="px-5 py-5 space-y-5">
            <div className="grid sm:grid-cols-[2fr_1fr] gap-3 items-end">
              <div>
                <label className="block text-[10px] tracking-[0.18em] uppercase text-stone-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="assistant@example.com"
                  className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.18em] uppercase text-stone-500 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  defaultValue="member"
                  className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                >
                  <option value="member">Member (custom permissions)</option>
                  <option value="owner">Owner (full access)</option>
                </select>
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-3">
                What they can see
              </div>
              <PermissionsGrid
                selected={new Set<string>()}
                idPrefix="add-new"
              />
              <p className="text-[10px] italic text-stone-500 mt-2">
                Owner role ignores these checkboxes — owners always have everything.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep transition-colors"
              >
                + Add admin
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="text-xs text-stone leading-relaxed space-y-1">
        <p>
          · <span className="font-medium">Owner</span> — sees everything, manages admins, manages settings.
        </p>
        <p>
          · <span className="font-medium">Member</span> — sees only the sections checked above. No money unless you grant
          &ldquo;Revenue + MRR.&rdquo;
        </p>
        <p>· Added admins gain access the moment they sign in with that email.</p>
      </div>
    </div>
  );
}
