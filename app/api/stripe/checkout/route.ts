import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { planById, type PlanId } from "@/lib/stripe/plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { planId } = (await req.json()) as { planId: PlanId };

  const plan = planById(planId);
  if (!plan || !plan.priceId) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, stripe_customer_id, beta_until")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile missing" }, { status: 500 });
  }

  // Beta testers already had ~a week of free access — they don't get a
  // second 3-day Stripe trial. Their subscription bills immediately.
  const hadBetaAccess = Boolean(profile.beta_until);

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
    line_items: [{ price: plan.priceId, quantity: 1 }],
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

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe did not return a session URL" },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
