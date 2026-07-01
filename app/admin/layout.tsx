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
      <header className="border-b border-stone-200 bg-white px-4 sm:px-6 pt-3 pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <h1 className="font-display text-xl sm:text-2xl text-forest-deep leading-tight">
              <span className="text-[10px] tracking-[0.3em] uppercase text-sage block">Admin</span>
              Sovereign
            </h1>
            <a
              href="/app"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-sage-pale/60 text-forest-deep text-xs font-medium hover:bg-sage-pale transition-colors flex-shrink-0"
              title="Switch to your own Sovereign workspace"
            >
              Open app →
            </a>
          </div>
          <AdminTabs role={me.role} permissions={me.permissions} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
