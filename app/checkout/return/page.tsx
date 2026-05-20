import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
import { syncSubscriptionFromStripe } from "@/lib/billing/sync";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ session_id?: string }>;

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = await searchParams;

  if (!session_id) redirect("/billing");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app`);

  // Pull the session from Stripe and verify it belongs to this user. Then
  // mirror the subscription row immediately so the (authed) gate passes even
  // before Stripe's webhook lands.
  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["subscription"],
  });

  const sessionUserId =
    (session.metadata?.user_id as string | undefined) ??
    (session.client_reference_id as string | null) ??
    null;
  if (sessionUserId && sessionUserId !== user.id) {
    redirect("/billing");
  }

  const sub = session.subscription;
  if (sub && typeof sub !== "string") {
    const admin = createAdminClient();
    try {
      await syncSubscriptionFromStripe(admin, sub, { userIdHint: user.id });
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      if (customerId) {
        await admin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
      }
    } catch (err) {
      console.error("[checkout-return] sync failed", err);
    }
    redirect("/app");
  }

  // Subscription not yet attached to the session (rare). Let the user click
  // through — by the time they do, the webhook will almost certainly have
  // landed, and the (authed) layout gate will let them in.
  return (
    <main className="min-h-screen bg-cream-bg flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-forest-deep mb-3">
          Finishing up…
        </h1>
        <p className="text-stone mb-6">
          Stripe accepted your payment. We&apos;re waiting on the final
          confirmation.
        </p>
        <Link
          href="/app"
          className="inline-block rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-forest-deep"
        >
          Open the app
        </Link>
      </div>
    </main>
  );
}
