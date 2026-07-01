"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission, type PermissionKey } from "@/lib/admin/permissions";

const TABS: { href: string; label: string; perm: PermissionKey }[] = [
  { href: "/admin",              label: "Overview",     perm: "overview" },
  { href: "/admin/active",       label: "Active",       perm: "active" },
  { href: "/admin/trial",        label: "On trial",     perm: "trial" },
  { href: "/admin/access",       label: "Free access",  perm: "access" },
  { href: "/admin/canceled",     label: "Canceled",     perm: "canceled" },
  { href: "/admin/revenue",      label: "Revenue",      perm: "revenue" },
  { href: "/admin/analytics",    label: "Analytics",    perm: "analytics" },
  { href: "/admin/affiliates",   label: "Affiliates",   perm: "affiliates" },
  { href: "/admin/community",    label: "Community",    perm: "community" },
  { href: "/admin/testimonials",  label: "Testimonials",  perm: "testimonials" },
  { href: "/admin/announcements",    label: "Announcements",   perm: "announcements" },
  { href: "/admin/daily-experience", label: "Daily Experience", perm: "daily_experience" },
  { href: "/admin/admins",           label: "Admins",           perm: "admins" },
];

export default function AdminTabs({
  role,
  permissions = [],
}: {
  role?: "owner" | "member";
  permissions?: string[];
}) {
  const path = usePathname();
  const me = { role: role ?? "member", permissions };
  const visibleTabs = TABS.filter((t) => hasPermission(me, t.perm));

  return (
    <nav className="flex gap-1 border-b border-stone-200 -mx-6 px-6 overflow-x-auto scrollbar-hide">
      {visibleTabs.map((t) => {
        const active = path === t.href || (t.href !== "/admin" && path.startsWith(t.href));
        const isOverviewActive = t.href === "/admin" && path === "/admin";
        const isActive = active || isOverviewActive;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-forest text-forest-deep font-medium"
                : "border-transparent text-stone hover:text-forest"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
