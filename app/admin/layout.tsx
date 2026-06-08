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
      <header className="border-b border-stone-200 bg-white px-6 pt-4 pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-sage">Admin</div>
              <h1 className="font-display text-2xl text-forest-deep">Sovereign — Customers</h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <a
                href="/app"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage-pale/60 text-forest-deep text-xs font-medium hover:bg-sage-pale transition-colors"
                title="Switch to your own Sovereign workspace"
              >
                Open my Sovereign app →
              </a>
              <div className="text-[11px] text-stone">
                Signed in as <span className="text-forest font-medium">{me.email}</span>
                <span className="ml-1.5 px-2 py-0.5 rounded bg-sage-pale/50 text-forest text-[10px] uppercase tracking-wider">
                  {me.role}
                </span>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto">
            <AdminTabs role={me.role} permissions={me.permissions} />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
