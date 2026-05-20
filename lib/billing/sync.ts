import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mirrors a Stripe Subscription into public.subscriptions. Shared by the
// Stripe webhook and the post-checkout return page so a webhook-delivery
// delay doesn't lock the user out of /app right after they pay.
export async function syncSubscriptionFromStripe(
  admin: SupabaseClient,
  sub: Stripe.Subscription,
  opts: { isDeletion?: boolean; userIdHint?: string | null } = {}
): Promise<{ userId: string | null }> {
  const userId =
    opts.userIdHint ?? (await resolveUserIdForSubscription(admin, sub));
  if (!userId) return { userId: null };

  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) return { userId };

  const isDeletion = Boolean(opts.isDeletion);

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
  if (error) throw new Error(`upsert subscription failed: ${error.message}`);

  return { userId };
}

export async function resolveUserIdForSubscription(
  admin: SupabaseClient,
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
