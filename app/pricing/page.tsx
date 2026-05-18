import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/stripe/plans";
import { createClient } from "@/lib/supabase/server";
import { startCheckoutAction } from "./actions";

type SearchParams = Promise<{ status?: string; error?: string }>;

export default async function PricingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = Boolean(user);

  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="px-6 py-5 border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl text-forest-deep tracking-tight"
          >
            Sovereign
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {isSignedIn ? (
              <>
                <Link href="/billing" className="text-stone hover:text-forest">
                  Billing
                </Link>
                <form action="/logout" method="POST">
                  <button
                    type="submit"
                    className="text-stone hover:text-forest"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-stone hover:text-forest">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-forest px-4 py-2 text-white hover:bg-forest-deep"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl text-forest-deep mb-4">
            Choose your plan
          </h1>
          <p className="text-stone text-lg max-w-2xl mx-auto">
            All plans unlock the full Sovereign experience. Start with a 3-day
            free trial — cancel anytime from your billing page.
          </p>
        </div>

        {status === "cancelled" && (
          <div className="mb-8 mx-auto max-w-2xl rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink">
            Checkout cancelled. No charge was made.
          </div>
        )}
        {error && (
          <div className="mb-8 mx-auto max-w-2xl rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isBestValue = plan.id === "12mo";
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border bg-white p-6 flex flex-col ${
                  isBestValue
                    ? "border-forest shadow-lg"
                    : "border-stone-200"
                }`}
              >
                {isBestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-forest text-white text-xs font-medium uppercase tracking-wider">
                    Best value
                  </div>
                )}

                <h2 className="font-display text-2xl text-forest-deep mb-1">
                  {plan.label}
                </h2>

                {plan.savingsPercent > 0 && (
                  <p className="text-sm text-sage font-medium mb-3">
                    Save {plan.savingsPercent}%
                  </p>
                )}
                {plan.savingsPercent === 0 && (
                  <p className="text-sm text-stone-light mb-3">&nbsp;</p>
                )}

                <div className="mb-2">
                  <span className="text-4xl font-display text-ink">
                    {formatPrice(plan.amountCents)}
                  </span>
                </div>
                <p className="text-sm text-stone mb-6">
                  {formatPrice(plan.monthlyEquivalentCents)} / month
                  {plan.intervalCount > 1 && (
                    <>
                      {" "}
                      <span className="text-stone-light">
                        · billed every {plan.intervalCount}{" "}
                        {plan.intervalCount === 12 ? "months" : plan.interval}
                      </span>
                    </>
                  )}
                </p>

                <ul className="text-sm text-stone space-y-2 mb-6">
                  <li>3-day free trial</li>
                  <li>All 12 Sovereign modules</li>
                  <li>Cancel anytime</li>
                </ul>

                <form action={startCheckoutAction} className="mt-auto">
                  <input type="hidden" name="planId" value={plan.id} />
                  <button
                    type="submit"
                    className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                      isBestValue
                        ? "bg-forest text-white hover:bg-forest-deep"
                        : "bg-white border border-forest text-forest hover:bg-cream"
                    }`}
                  >
                    Start 3-day free trial
                  </button>
                </form>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-stone-light mt-8">
          Card required at signup. We charge on day 4 unless you cancel. All
          prices in USD.
        </p>
      </main>
    </div>
  );
}
