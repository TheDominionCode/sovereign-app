import { requireAdmin } from "./guard";
import AdminTabs from "./_components/AdminTabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireAdmin();
  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="border-b border-stone-200 bg-white sticky top-0 z-30">
        {/* Top bar — one tight row on mobile */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] tracking-[0.3em] uppercase text-sage font-semibold flex-shrink-0">Admin</span>
            <span className="text-stone-300 text-xs flex-shrink-0">·</span>
            <span className="font-display text-base text-forest-deep truncate">Sovereign</span>
          </div>
          <a
            href="/app"
            className="flex-shrink-0 px-3 py-1 rounded-full bg-sage-pale/70 text-forest-deep text-[11px] font-medium hover:bg-sage-pale transition-colors whitespace-nowrap"
          >
            Open app →
          </a>
        </div>
        {/* Tabs — single row, horizontal scroll, no wrap */}
        <AdminTabs role={me.role} permissions={me.permissions} />
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">{children}</main>
    </div>
  );
}
