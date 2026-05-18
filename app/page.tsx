import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream-bg">
      <div className="text-center px-6 max-w-xl">
        <div className="text-[11px] tracking-[0.3em] text-forest mb-3">
          SOVEREIGN
        </div>
        <h1 className="font-display text-5xl font-semibold text-ink mb-4">
          Build the <em className="italic font-normal text-forest">life</em>.
        </h1>
        <p className="font-cormorant text-xl text-stone leading-relaxed mb-10">
          Calm, centered, in charge. The operating system for the woman behind
          everything.
        </p>

        {user ? (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/app"
              className="rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-deep"
            >
              Open app
            </Link>
            <Link
              href="/billing"
              className="rounded-md border border-forest px-5 py-2.5 text-sm font-medium text-forest hover:bg-cream"
            >
              Billing
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-deep"
            >
              See pricing
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-forest px-5 py-2.5 text-sm font-medium text-forest hover:bg-cream"
            >
              Sign in
            </Link>
          </div>
        )}

        {user && (
          <div className="mt-8 text-xs uppercase tracking-[0.24em] text-sage">
            Signed in as {user.email}
          </div>
        )}
      </div>
    </main>
  );
}
