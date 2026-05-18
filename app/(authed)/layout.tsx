import Link from "next/link";
import { requireActiveSubscription } from "@/lib/billing/subscription";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireActiveSubscription();

  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="px-6 py-5 border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/app"
            className="font-display text-2xl text-forest-deep tracking-tight"
          >
            Sovereign
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <span className="text-stone-light hidden sm:inline">
              {user.email}
            </span>
            <Link href="/billing" className="text-stone hover:text-forest">
              Billing
            </Link>
            <form action="/logout" method="POST">
              <button type="submit" className="text-stone hover:text-forest">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
