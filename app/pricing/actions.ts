"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { planById, type PlanId } from "@/lib/stripe/plans";

export async function startCheckoutAction(formData: FormData) {
  const planId = String(formData.get("planId") ?? "") as PlanId;
  const plan = planById(planId);
  if (!plan || !plan.priceId) {
    redirect(`/pricing?error=${encodeURIComponent("Unknown plan")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signup?next=${encodeURIComponent(`/pricing?plan=${planId}`)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, stripe_customer_id, beta_until")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    redirect(`/pricing?error=${encodeURIComponent("Profile missing")}`);
  }

  // Beta testers (anyone who had free tester access via /admin/access or the
  // signup invite) don't get a second 3-day Stripe trial on top — they've
  // already had ~a week of free access. They're charged on subscription start.
  const hadBetaAccess = Boolean(profile.beta_until);

  let customerId = profile.stripe_customer_id as string | null;
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Customer creation failed";
      console.error("[startCheckoutAction] customers.create failed:", msg);
      redirect(`/pricing?error=${encodeURIComponent(msg)}`);
    }
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  let sessionUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId!,
      line_items: [{ price: plan!.priceId, quantity: 1 }],
      subscription_data: {
        ...(hadBetaAccess ? {} : { trial_period_days: 3 }),
        metadata: { user_id: user.id },
      },
      payment_method_collection: "always",
      success_url: `${site}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/pricing?status=cancelled`,
      allow_promotion_codes: false,
      client_reference_id: user.id,
    });
    sessionUrl = session.url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Checkout session failed";
    console.error("[startCheckoutAction] sessions.create failed:", msg, {
      planId,
      priceId: plan?.priceId,
    });
    redirect(`/pricing?error=${encodeURIComponent(msg)}`);
  }

  if (!sessionUrl) {
    redirect(`/pricing?error=${encodeURIComponent("Stripe session URL missing")}`);
  }

  redirect(sessionUrl);
}
