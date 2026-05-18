import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
        await upsertSubscription(admin, sub, event.type === "customer.subscription.deleted");
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

async function upsertSubscription(
  admin: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription,
  isDeletion: boolean
) {
  const userId = await resolveUserId(admin, sub);
  if (!userId) {
    console.warn(
      "[stripe-webhook] could not resolve user_id for subscription",
      sub.id
    );
    return;
  }

  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) {
    console.warn("[stripe-webhook] subscription missing price_id", sub.id);
    return;
  }

  const row = {
    id: sub.id,
    user_id: userId,
    status: isDeletion ? "canceled" : (sub.status as string),
    price_id: priceId,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    canceled_at: sub.canceled_at
      ? new Date(sub.canceled_at * 1000).toISOString()
      : isDeletion
        ? new Date().toISOString()
        : null,
  };

  const { error } = await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "id" });
  if (error) {
    throw new Error(`upsert subscription failed: ${error.message}`);
  }
}

async function resolveUserId(
  admin: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription
): Promise<string | null> {
  const metaUserId = sub.metadata?.user_id;
  if (metaUserId) return metaUserId;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;

  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}
