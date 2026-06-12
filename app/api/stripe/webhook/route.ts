import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSubscriptionFromStripe } from "@/lib/billing/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Idempotency check — has this event ALREADY been fully processed?
  // We only treat it as a duplicate if the row is there; we don't insert
  // here so a failed handler can be safely retried by Stripe. The insert
  // happens at the very end, after the handler has actually succeeded.
  const { data: existing } = await admin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    // Still record so Stripe doesn't keep retrying ignored types.
    await admin
      .from("stripe_events")
      .insert({ id: event.id, type: event.type })
      .then(() => {}, () => {});
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const userId =
          (session.metadata?.user_id as string | undefined) ??
          (session.client_reference_id as string | null) ??
          null;
        if (customerId && userId) {
          await admin
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { userId } = await syncSubscriptionFromStripe(admin, sub, {
          isDeletion: event.type === "customer.subscription.deleted",
        });
        if (!userId) {
          console.warn(
            "[stripe-webhook] could not resolve user_id for subscription",
            sub.id
          );
        }
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        // Stripe will emit a corresponding subscription.updated; state is mirrored from there.
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] handler failed", event.type, err);
    // Don't record the event so Stripe will retry this delivery — that
    // way a transient bug won't permanently lose the event.
    return NextResponse.json(
      { error: "Handler error", type: event.type },
      { status: 500 }
    );
  }

  // Handler succeeded — NOW record so the next delivery is a no-op.
  await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type })
    .then(() => {}, () => {});
  return NextResponse.json({ received: true });
}

