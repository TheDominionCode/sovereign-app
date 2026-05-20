"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string }[] = [
  { href: "/app", label: "Summary" },
  { href: "/app/planner", label: "Daily Planner" },
  { href: "/app/calendar", label: "Calendar" },
  { href: "/app/habits", label: "Habits" },
  { href: "/app/goals", label: "Goals" },
  { href: "/app/growth", label: "Growth & Self" },
  { href: "/app/finance", label: "Personal Finance" },
  { href: "/app/cycle", label: "Cycle & Mood" },
  { href: "/app/speak", label: "Speak Eloquently" },
  { href: "/app/affirmations", label: "Affirmations" },
  { href: "/app/boundaries", label: "Boundaries" },
  { href: "/app/vision", label: "Vision Board" },
  { href: "/app/notes", label: "Notes" },
  { href: "/app/credentials", label: "Logins & Passwords" },
  { href: "/app/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname?.startsWith(href);

  return (
    <aside className="w-60 flex-shrink-0 border-r border-stone-200 bg-white flex flex-col sticky top-0 h-screen">
      <div className="p-4 border-b border-stone-200">
        <Link href="/app" className="block leading-tight">
          <div className="font-display text-lg text-sage">Sovereign</div>
          <div className="text-[10px] italic text-stone-light tracking-wide font-cormorant">
            Calm, centered, in charge.
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 text-sm border-l-2 transition ${
                active
                  ? "border-sage bg-cream-bg text-forest font-medium"
                  : "border-transparent text-stone hover:bg-stone-50 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-stone-200">
        <form action="/logout" method="POST">
          <button
            type="submit"
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-stone-100 text-stone"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
