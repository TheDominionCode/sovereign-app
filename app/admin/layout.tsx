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
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-sage">Admin</div>
              <h1 className="font-display text-2xl text-forest-deep">Sovereign — Customers</h1>
            </div>
            <div className="text-xs text-stone">
              Signed in as <span className="text-forest font-medium">{me.email}</span>
              <span className="ml-2 px-2 py-0.5 rounded bg-sage-pale/50 text-forest text-[10px] uppercase tracking-wider">
                {me.role}
              </span>
              <a href="/app" className="ml-4 text-stone hover:text-forest underline">← Back to app</a>
            </div>
          </div>
          <div className="max-w-7xl mx-auto">
            <AdminTabs />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
