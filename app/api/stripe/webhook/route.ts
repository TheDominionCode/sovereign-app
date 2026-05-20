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

  // Idempotency: insert event id. Unique-violation means we already handled it.
  const { error: dedupeErr } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });

  if (dedupeErr) {
    if (dedupeErr.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[stripe-webhook] dedupe insert failed", dedupeErr);
    // Continue anyway; better to double-process than to lose state.
  }

  if (!HANDLED_EVENTS.has(event.type)) {
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
    return NextResponse.json(
      { error: "Handler error", type: event.type },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

