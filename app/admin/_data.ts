// Shared data fetchers + formatters for /admin sub-pages.
// All run server-side with the service-role client so they bypass RLS;
// the layout's requireAdmin() guard already gates the visitor.

import { createAdminClient } from "@/lib/supabase/admin";
import { priceIdToPlan, type Plan } from "@/lib/stripe/plans";

export type ClickRow = {
  id: number;
  link_slug: string;
  path: string | null;
  clicked_at: string;
  ip: string | null;
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
};

// Pulls every click in the last `days` window, newest first. Used by the
// analytics page to bucket into daily totals + hourly distribution and to
// list raw referrers. We cap at 10k rows so a viral spike can't blow up the
// admin page; if we ever cross that, switch to a server-side aggregation
// SQL view.
export async function getRecentClicks(days = 30): Promise<ClickRow[]> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await admin
    .from("clicks")
    .select("id,link_slug,path,clicked_at,ip,referrer,user_agent,country")
    .gte("clicked_at", since)
    .order("clicked_at", { ascending: false })
    .limit(10_000);
  return (data ?? []) as ClickRow[];
}

// Funnel events for the analytics dashboard.
//   signupAt — auth.users.created_at (account made)
//   trialAt  — any subscription's first current_period_start (entered the
//              funnel by starting a free trial; status was 'trialing')
//   paidAt   — first subscription start whose status is 'active' and not
//              currently in trial (they continued paying after the trial,
//              OR they paid directly without a trial).
// Each is independently null/non-null so the analytics page can render the
// "24 clicked → 3 trialed → 1 paying" leaderboard cleanly.
export type ConversionEvent = {
  userId: string;
  email: string | null;
  signupAt: string;
  trialAt: string | null;
  paidAt: string | null;
};

export async function getRecentConversions(days = 90): Promise<ConversionEvent[]> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const [usersRes, subsRes] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 500 }),
    admin
      .from("subscriptions")
      .select("user_id,current_period_start,status,trial_end")
      .gte("current_period_start", since),
  ]);

  const trialByUser = new Map<string, string>();
  const paidByUser = new Map<string, string>();
  const now = Date.now();
  for (const s of subsRes.data ?? []) {
    if (!s.current_period_start) continue;
    // Anyone with a non-canceled subscription counts as having "started"
    // the funnel — either trialing or paying.
    if (["trialing", "active", "past_due"].includes(s.status)) {
      const prevTrial = trialByUser.get(s.user_id);
      if (!prevTrial || s.current_period_start < prevTrial) {
        trialByUser.set(s.user_id, s.current_period_start);
      }
    }
    // "Paying" = active AND the trial period has already ended (or never
    // existed). past_due also counts as paying — they entered a billing cycle.
    const trialEnded = !s.trial_end || new Date(s.trial_end).getTime() <= now;
    if ((s.status === "active" || s.status === "past_due") && trialEnded) {
      const prevPaid = paidByUser.get(s.user_id);
      if (!prevPaid || s.current_period_start < prevPaid) {
        paidByUser.set(s.user_id, s.current_period_start);
      }
    }
  }

  return (usersRes.data?.users ?? [])
    .filter((u) => u.created_at && u.created_at >= since)
    .map((u) => ({
      userId: u.id,
      email: u.email ?? null,
      signupAt: u.created_at!,
      trialAt: trialByUser.get(u.id) ?? null,
      paidAt: paidByUser.get(u.id) ?? null,
    }));
}

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  stripe_customer_id: string | null;
  beta_until: string | null;
  created_at: string;
};

export type SubscriptionRow = {
  user_id: string;
  status: string;
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  canceled_at: string | null;
};

export type AdminRow = {
  email: string;
  role: string;
  added_at: string;
  added_by: string | null;
  permissions: string[];
};

export type CustomerRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  stripeCustomerId: string | null;
  plan: Plan | null;
  status: string;
  trialEnd: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceled: boolean;
  canceledAt: string | null;
  betaUntil: string | null;
  createdAt: string;
  lastSignIn: string | null;
};

export const MAX_ADMINS = 5;

// Public launch was Sunday Jun 7, 2026 (US Eastern). Anyone created BEFORE
// this is a pre-launch test account from the build phase — exclude them
// from the admin counts unless they later became a paying / trialing
// customer (Stripe customer id present or any subscription row).
//
// Bumping this date hides more historical test accounts; lowering it
// surfaces older ones. The check below treats the boundary as exclusive
// of the start of the day so the launch day itself counts as "live."
export const LAUNCH_DATE_ISO = "2026-06-07T00:00:00Z";

function isPreLaunchTestAccount(row: CustomerRow): boolean {
  if (row.createdAt >= LAUNCH_DATE_ISO) return false;
  // Even if pre-launch, keep them if they ever became a real customer.
  if (row.stripeCustomerId) return false;
  if (row.status && row.status !== "—") return false;
  return true;
}

export async function getCustomerRows(): Promise<CustomerRow[]> {
  const admin = createAdminClient();
  const [profilesRes, subsRes, usersRes] = await Promise.all([
    admin.from("profiles").select("id,email,full_name,phone,stripe_customer_id,beta_until,created_at"),
    admin.from("subscriptions").select("user_id,status,price_id,current_period_start,current_period_end,cancel_at_period_end,trial_end,canceled_at"),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);
  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const subs = (subsRes.data ?? []) as SubscriptionRow[];
  const authUsers = usersRes.data?.users ?? [];

  // Pick the "best" subscription per user — prefer trialing/active over older canceled.
  const subByUser = new Map<string, SubscriptionRow>();
  for (const s of subs) {
    const prev = subByUser.get(s.user_id);
    if (!prev || ((prev.status !== "trialing" && prev.status !== "active") &&
                  (s.status === "trialing" || s.status === "active"))) {
      subByUser.set(s.user_id, s);
    }
  }
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const rows: CustomerRow[] = authUsers.map((u) => {
    const p = profileById.get(u.id);
    const s = subByUser.get(u.id);
    return {
      id: u.id,
      email: u.email ?? p?.email ?? "—",
      name: p?.full_name ?? null,
      phone: p?.phone ?? null,
      stripeCustomerId: p?.stripe_customer_id ?? null,
      plan: s ? priceIdToPlan(s.price_id) ?? null : null,
      status: s?.status ?? "—",
      trialEnd: s?.trial_end ?? null,
      periodStart: s?.current_period_start ?? null,
      periodEnd: s?.current_period_end ?? null,
      cancelAtPeriodEnd: !!s?.cancel_at_period_end,
      canceled: !!s?.canceled_at || s?.status === "canceled",
      canceledAt: s?.canceled_at ?? null,
      betaUntil: p?.beta_until ?? null,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
    };
  });

  // Hide pre-launch test accounts that never became customers.
  const filtered = rows.filter((r) => !isPreLaunchTestAccount(r));
  // Newest first.
  filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return filtered;
}

export async function getAdmins(): Promise<AdminRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admins")
    .select("email,role,added_at,added_by,permissions")
    .order("added_at");
  return (data ?? []).map((r) => ({
    ...r,
    permissions: Array.isArray(r.permissions) ? r.permissions : [],
  })) as AdminRow[];
}

export type AdminStats = {
  total: number;
  trialing: number;
  active: number;
  canceled: number;
  mrrCents: number;
  trialPipelineCents: number;
};

export function computeStats(rows: CustomerRow[]): AdminStats {
  const total = rows.length;
  const trialing = rows.filter((r) => r.status === "trialing").length;
  const active = rows.filter((r) => r.status === "active").length;
  const canceled = rows.filter((r) => r.canceled).length;
  const mrrCents = rows.reduce((sum, r) =>
    (r.status === "active" && r.plan ? sum + r.plan.monthlyEquivalentCents : sum), 0);
  const trialPipelineCents = rows.reduce((sum, r) =>
    (r.status === "trialing" && r.plan ? sum + r.plan.amountCents : sum), 0);
  return { total, trialing, active, canceled, mrrCents, trialPipelineCents };
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function daysFromNow(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
