import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "unpaid"
    | "paused";
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  canceled_at: string | null;
};

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getActiveSubscription = cache(
  async (userId: string): Promise<SubscriptionRow | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["trialing", "active"])
      .gt("current_period_end", new Date().toISOString())
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return (data as SubscriptionRow | null) ?? null;
  }
);

export const hasActiveSubscription = cache(
  async (userId: string): Promise<boolean> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("has_active_subscription", {
      uid: userId,
    });
    if (error) return false;
    return Boolean(data);
  }
);

// Server-component guard. Redirects to /login if signed out, /pricing if no
// active subscription. Returns the user on success.
export async function requireActiveSubscription() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app");
  const ok = await hasActiveSubscription(user.id);
  if (!ok) redirect("/pricing");
  return user;
}
