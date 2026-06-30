// Permission keys for the admin dashboard. Each key gates exactly one
// admin section. The list is rendered in /admin/admins as a checkbox grid;
// the owner picks which boxes a member admin has.
//
// Owner role bypasses these entirely — owners always see everything.

export type PermissionKey =
  | "overview"
  | "active"
  | "trial"
  | "access"
  | "canceled"
  | "revenue"
  | "analytics"
  | "affiliates"
  | "community"
  | "testimonials"
  | "announcements"
  | "daily_experience"
  | "admins";

export type PermissionGroup = "customers" | "money" | "growth" | "people";

export type PermissionDef = {
  key: PermissionKey;
  label: string;
  hint: string;
  group: PermissionGroup;
};

// Ordered so the UI groups related items together. The hint is shown under
// each checkbox so the owner doesn't have to guess what a permission unlocks.
export const PERMISSIONS: PermissionDef[] = [
  { key: "overview",     label: "Overview",           hint: "Landing tiles + recent signups. Stat tiles they can't drill into are hidden.", group: "customers" },
  { key: "active",       label: "Active subscribers", hint: "Paying customers list, names, statuses, renewal dates.", group: "customers" },
  { key: "trial",        label: "On trial",           hint: "Trial countdown list + who's about to expire.", group: "customers" },
  { key: "access",       label: "Free access",        hint: "Grant testers comp'd access without Stripe.", group: "customers" },
  { key: "canceled",     label: "Canceled",           hint: "Churned + canceled list.", group: "customers" },
  { key: "revenue",      label: "Revenue + MRR",      hint: "Money. MRR, plan breakdown, conversion rates, dollar amounts.", group: "money" },
  { key: "analytics",    label: "Visit analytics",    hint: "Landing-page visit counts, charts, top referrers, conversion %.", group: "growth" },
  { key: "affiliates",   label: "Affiliate moderation", hint: "Approve / reject affiliate program applications.", group: "growth" },
  { key: "community",    label: "Community moderation", hint: "Review + approve Wall-of-wins posts. Edit the heading quote + theme.", group: "growth" },
  { key: "testimonials", label: "Testimonials",       hint: "Review + approve testimonial submissions.", group: "growth" },
  { key: "announcements",    label: "Announcements",      hint: "Send in-app messages to every signed-in user (appears as a popup).", group: "growth" },
  { key: "daily_experience", label: "Daily Experience",   hint: "Manage daily principles, reflections, questions, and intentions shown in the app.", group: "growth" },
  { key: "admins",           label: "Manage admins",      hint: "Add / remove / re-permission other staff. Grant carefully.", group: "people" },
];

export const GROUP_LABELS: Record<PermissionGroup, string> = {
  customers: "Customers",
  money: "Money",
  growth: "Growth",
  people: "Permissions",
};

// True if `me` can see the section keyed by `perm`. Owners always pass.
export function hasPermission(
  me: { role: "owner" | "member"; permissions?: string[] | null },
  perm: PermissionKey,
): boolean {
  if (me.role === "owner") return true;
  const perms = me.permissions ?? [];
  if (perms.includes("all")) return true;
  return perms.includes(perm);
}
