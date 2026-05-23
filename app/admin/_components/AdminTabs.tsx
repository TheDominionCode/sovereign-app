"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin",          label: "Overview" },
  { href: "/admin/active",   label: "Active" },
  { href: "/admin/trial",    label: "On trial" },
  { href: "/admin/canceled", label: "Canceled" },
  { href: "/admin/revenue",  label: "Revenue" },
  { href: "/admin/admins",   label: "Admins" },
];

export default function AdminTabs() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-stone-200 -mx-6 px-6">
      {TABS.map((t) => {
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
