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

  const item = sub.items.data[0];
  const priceId = item?.price?.id;
  if (!priceId) return { userId };

  const isDeletion = Boolean(opts.isDeletion);

  // Stripe moved current_period_start/end onto SubscriptionItem in recent
  // API versions (2026-05-27.dahlia). Older versions kept them on the
  // Subscription itself. We try Subscription first, fall back to the
  // SubscriptionItem so the webhook works regardless of which version
  // Stripe replies with — and crashes a webhook handler is what was
  // leaving Elizabeth's record stuck on `trialing` after she paid.
  const subAny = sub as unknown as {
    current_period_start?: number | null;
    current_period_end?: number | null;
  };
  const itemAny = item as unknown as {
    current_period_start?: number | null;
    current_period_end?: number | null;
  } | undefined;
  const periodStart = subAny.current_period_start ?? itemAny?.current_period_start ?? null;
  const periodEnd = subAny.current_period_end ?? itemAny?.current_period_end ?? null;

  const toIso = (epochSec: number | null | undefined) =>
    typeof epochSec === "number" && Number.isFinite(epochSec)
      ? new Date(epochSec * 1000).toISOString()
      : null;

  const row = {
    id: sub.id,
    user_id: userId,
    status: isDeletion ? "canceled" : (sub.status as string),
    price_id: priceId,
    current_period_start: toIso(periodStart),
    current_period_end: toIso(periodEnd),
    cancel_at_period_end: sub.cancel_at_period_end,
    trial_end: toIso(sub.trial_end),
    canceled_at: sub.canceled_at
      ? toIso(sub.canceled_at)
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
