import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveSubscription, getCurrentUser } from "@/lib/billing/subscription";
import { priceIdToPlan, formatPrice } from "@/lib/stripe/plans";
import { openBillingPortalAction } from "./actions";

type SearchParams = Promise<{ status?: string }>;

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  trialing: { label: "Free trial", tone: "bg-sage-pale text-forest-deep" },
  active: { label: "Active", tone: "bg-sage-pale text-forest-deep" },
  past_due: { label: "Payment failed", tone: "bg-rose/15 text-rose" },
  canceled: { label: "Canceled", tone: "bg-stone-200 text-stone" },
  incomplete: { label: "Incomplete", tone: "bg-gold/15 text-ink" },
  incomplete_expired: { label: "Expired", tone: "bg-stone-200 text-stone" },
  unpaid: { label: "Unpaid", tone: "bg-rose/15 text-rose" },
  paused: { label: "Paused", tone: "bg-stone-200 text-stone" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/billing");

  const subscription = await getActiveSubscription(user.id);
  const plan = subscription ? priceIdToPlan(subscription.price_id) : null;
  const statusInfo = subscription
    ? STATUS_LABELS[subscription.status]
    : null;

  return (
    <div className="min-h-screen bg-cream-bg">
      <header className="px-6 py-5 border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl text-forest-deep tracking-tight"
          >
            Sovereign
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/app" className="text-stone hover:text-forest">
              App
            </Link>
            <form action="/logout" method="POST">
              <button type="submit" className="text-stone hover:text-forest">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-forest-deep mb-2">Billing</h1>
        <p className="text-stone mb-8">
          Signed in as <span className="text-ink">{user.email}</span>
        </p>

        {status === "success" && (
          <div className="mb-8 rounded-md border border-sage/40 bg-sage-pale/40 px-4 py-3 text-sm text-forest-deep">
            You&apos;re in. Your subscription is active — head to{" "}
            <Link href="/app" className="font-medium underline">
              the app
            </Link>
            .
          </div>
        )}

        {subscription && plan && statusInfo ? (
          <div className="rounded-lg border border-stone-200 bg-white p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl text-ink mb-1">
                  {plan.label}
                </h2>
                <p className="text-stone">
                  {formatPrice(plan.amountCents)} every {plan.intervalCount}{" "}
                  {plan.intervalCount === 12 ? "months" : plan.interval}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.tone}`}
              >
                {statusInfo.label}
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-sm">
              {subscription.status === "trialing" && subscription.trial_end && (
                <div>
                  <dt className="text-stone-light uppercase tracking-wider text-xs mb-1">
                    Trial ends
                  </dt>
                  <dd className="text-ink">
                    {formatDate(subscription.trial_end)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-stone-light uppercase tracking-wider text-xs mb-1">
                  {subscription.cancel_at_period_end
                    ? "Access ends"
                    : "Next renewal"}
                </dt>
                <dd className="text-ink">
                  {formatDate(subscription.current_period_end)}
                </dd>
              </div>
              {subscription.cancel_at_period_end && (
                <div className="sm:col-span-2 rounded-md bg-gold/10 border border-gold/30 px-3 py-2 text-xs text-ink">
                  Your subscription is set to cancel at the end of the current
                  period. You can re-enable auto-renew from the billing portal.
                </div>
              )}
            </dl>

            <form action={openBillingPortalAction}>
              <button
                type="submit"
                className="rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-forest-deep"
              >
                Manage billing
              </button>
            </form>
            <p className="text-xs text-stone-light mt-3">
              Update card, cancel, switch plans, or download invoices.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="font-display text-2xl text-ink mb-2">
              No active subscription
            </h2>
            <p className="text-stone mb-6">
              Pick a plan to unlock the full Sovereign experience.
            </p>
            <Link
              href="/pricing"
              className="inline-block rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-forest-deep"
            >
              Choose a plan
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
