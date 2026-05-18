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
    .select("id, email, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    redirect(`/pricing?error=${encodeURIComponent("Profile missing")}`);
  }

  let customerId = profile.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan!.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 3,
      metadata: { user_id: user.id },
    },
    payment_method_collection: "always",
    success_url: `${site}/billing?status=success`,
    cancel_url: `${site}/pricing?status=cancelled`,
    allow_promotion_codes: false,
    client_reference_id: user.id,
  });

  if (!session.url) {
    redirect(`/pricing?error=${encodeURIComponent("Stripe session URL missing")}`);
  }

  redirect(session.url!);
}
