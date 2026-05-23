import { createAdminClient } from "@/lib/supabase/admin";
import { priceIdToPlan, formatPrice, type Plan } from "@/lib/stripe/plans";
import { requireAdmin } from "./guard";
import { addAdminAction, removeAdminAction } from "./actions";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  stripe_customer_id: string | null;
  created_at: string;
};

type SubscriptionRow = {
  user_id: string;
  status: string;
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  canceled_at: string | null;
};

type AdminRow = {
  email: string;
  role: string;
  added_at: string;
  added_by: string | null;
};

const MAX_ADMINS = 5;

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    trialing:           { bg: "bg-amber-50",   text: "text-amber-700",   label: "Trial" },
    active:             { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
    past_due:           { bg: "bg-rose-50",    text: "text-rose-700",    label: "Past due" },
    canceled:           { bg: "bg-stone-100",  text: "text-stone-500",   label: "Canceled" },
    incomplete:         { bg: "bg-stone-100",  text: "text-stone-500",   label: "Incomplete" },
    incomplete_expired: { bg: "bg-stone-100",  text: "text-stone-500",   label: "Expired" },
    unpaid:             { bg: "bg-rose-50",    text: "text-rose-700",    label: "Unpaid" },
    paused:             { bg: "bg-stone-100",  text: "text-stone-500",   label: "Paused" },
  };
  const m = map[status] ?? { bg: "bg-stone-100", text: "text-stone-500", label: status || "—" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
}

export default async function AdminPage() {
  const me = await requireAdmin();
  const admin = createAdminClient();

  // ---- Fetch everything in parallel ----
  const [profilesRes, subsRes, usersRes, adminsRes] = await Promise.all([
    admin.from("profiles").select("id,email,full_name,phone,stripe_customer_id,created_at"),
    admin.from("subscriptions").select("user_id,status,price_id,current_period_start,current_period_end,cancel_at_period_end,trial_end,canceled_at"),
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from("admins").select("email,role,added_at,added_by").order("added_at"),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const subs = (subsRes.data ?? []) as SubscriptionRow[];
  const authUsers = usersRes.data?.users ?? [];
  const admins = (adminsRes.data ?? []) as AdminRow[];

  // ---- Index for joining ----
  const subByUser = new Map<string, SubscriptionRow>();
  for (const s of subs) {
    const prev = subByUser.get(s.user_id);
    // Prefer trialing/active over older canceled rows.
    if (!prev || ((prev.status !== "trialing" && prev.status !== "active") &&
                  (s.status === "trialing" || s.status === "active"))) {
      subByUser.set(s.user_id, s);
    }
  }
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const lastSignInByUser = new Map<string, string | null>(
    authUsers.map((u) => [u.id, u.last_sign_in_at ?? null])
  );

  // Build the rows we'll render — one per auth user.
  type Row = {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    plan: Plan | null;
    status: string;
    trialEnd: string | null;
    periodEnd: string | null;
    canceled: boolean;
    canceledAt: string | null;
    createdAt: string;
    lastSignIn: string | null;
  };
  const rows: Row[] = authUsers.map((u) => {
    const p = profileById.get(u.id);
    const s = subByUser.get(u.id);
    return {
      id: u.id,
      email: u.email ?? p?.email ?? "—",
      name: p?.full_name ?? null,
      phone: p?.phone ?? null,
      plan: s ? priceIdToPlan(s.price_id) ?? null : null,
      status: s?.status ?? "—",
      trialEnd: s?.trial_end ?? null,
      periodEnd: s?.current_period_end ?? null,
      canceled: !!s?.canceled_at,
      canceledAt: s?.canceled_at ?? null,
      createdAt: u.created_at,
      lastSignIn: lastSignInByUser.get(u.id) ?? null,
    };
  }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // ---- Stats ----
  const total = rows.length;
  const trialing = rows.filter((r) => r.status === "trialing").length;
  const active = rows.filter((r) => r.status === "active").length;
  const canceled = rows.filter((r) => r.status === "canceled" || r.canceled).length;
  const mrrCents = rows.reduce((sum, r) => {
    if (r.status !== "active" || !r.plan) return sum;
    return sum + r.plan.monthlyEquivalentCents;
  }, 0);
  const trialPipelineCents = rows.reduce((sum, r) => {
    if (r.status !== "trialing" || !r.plan) return sum;
    return sum + r.plan.amountCents;
  }, 0);

  const isOwner = me.role === "owner";

  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-baseline justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-sage">Admin</div>
            <h1 className="font-display text-2xl text-forest-deep">Customers</h1>
          </div>
          <div className="text-xs text-stone">
            Signed in as <span className="text-forest font-medium">{me.email}</span>
            <span className="ml-2 px-2 py-0.5 rounded bg-sage-pale/50 text-forest text-[10px] uppercase tracking-wider">
              {me.role}
            </span>
            <a href="/app" className="ml-4 text-stone hover:text-forest underline">← Back to app</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Total signups", value: String(total) },
            { label: "Active subs",   value: String(active) },
            { label: "On trial",      value: String(trialing) },
            { label: "Canceled",      value: String(canceled) },
            { label: "MRR",           value: formatPrice(mrrCents) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">{s.label}</div>
              <div className="font-display text-2xl text-forest-deep mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        {trialPipelineCents > 0 && (
          <p className="text-xs italic text-stone mb-6">
            Trial pipeline (revenue if every current trial converts at their selected plan): <span className="text-forest font-medium not-italic">{formatPrice(trialPipelineCents)}</span>
          </p>
        )}

        {/* CUSTOMERS TABLE */}
        <section className="rounded-lg border border-stone-200 bg-white overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-stone-100 flex items-baseline justify-between">
            <h2 className="font-display text-lg text-ink">Customers</h2>
            <span className="text-xs text-stone-light">{total} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr className="text-left text-[10px] tracking-[0.18em] uppercase text-stone-500">
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">Plan</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Trial ends</th>
                  <th className="px-4 py-2 font-medium">Renews / Ends</th>
                  <th className="px-4 py-2 font-medium">Signed up</th>
                  <th className="px-4 py-2 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center italic text-stone">No customers yet.</td></tr>
                ) : rows.map((r) => (
                  <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50/60">
                    <td className="px-4 py-2.5 text-stone-800 whitespace-nowrap">{r.email}</td>
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.name || <span className="italic text-stone-400">—</span>}</td>
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.phone || <span className="italic text-stone-400">—</span>}</td>
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.plan?.label ?? <span className="italic text-stone-400">—</span>}</td>
                    <td className="px-4 py-2.5">{statusBadge(r.status)}</td>
                    <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{fmtDate(r.trialEnd)}</td>
                    <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{fmtDate(r.periodEnd)}</td>
                    <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{fmtDate(r.lastSignIn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ADMINS — visible to everyone; only owners can modify */}
        <section className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 flex items-baseline justify-between">
            <h2 className="font-display text-lg text-ink">Admins</h2>
            <span className="text-xs text-stone-light">{admins.length} of {MAX_ADMINS} seats used</span>
          </div>
          <div className="divide-y divide-stone-100">
            {admins.map((a) => (
              <div key={a.email} className="px-4 py-3 flex items-center gap-3">
                <span className="font-medium text-ink">{a.email}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${a.role === "owner" ? "bg-forest text-white" : "bg-sage-pale/60 text-forest"}`}>
                  {a.role}
                </span>
                <span className="ml-auto text-xs text-stone-light">added {fmtDate(a.added_at)}</span>
                {isOwner && a.email !== me.email && a.role !== "owner" && (
                  <form action={removeAdminAction}>
                    <input type="hidden" name="email" value={a.email} />
                    <button type="submit" className="text-xs text-stone-400 hover:text-rose-500" title="Remove admin">Remove</button>
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

        <p className="mt-8 text-xs text-stone-light italic">
          Up to {MAX_ADMINS} admins. Owners have full access (see customers, see revenue, manage admins). Members are read-only — they can view this page but can&apos;t add or remove other admins.
        </p>
      </main>
    </div>
  );
}
