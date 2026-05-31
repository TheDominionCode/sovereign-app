export type PlanId = "1mo" | "3mo" | "6mo" | "12mo";

export type Plan = {
  id: PlanId;
  priceId: string;
  label: string;
  amountCents: number;
  interval: "month" | "year";
  intervalCount: number;
  monthlyEquivalentCents: number;
  savingsPercent: number;
};

export const PLANS: readonly Plan[] = [
  {
    id: "1mo",
    priceId: process.env.STRIPE_PRICE_1MO ?? "",
    label: "1 month",
    amountCents: 1499,
    interval: "month",
    intervalCount: 1,
    monthlyEquivalentCents: 1499,
    savingsPercent: 0,
  },
  {
    id: "3mo",
    priceId: process.env.STRIPE_PRICE_3MO ?? "",
    label: "3 months",
    amountCents: 3999,
    interval: "month",
    intervalCount: 3,
    monthlyEquivalentCents: 1333,
    savingsPercent: 11,
  },
  {
    id: "6mo",
    priceId: process.env.STRIPE_PRICE_6MO ?? "",
    label: "6 months",
    amountCents: 7499,
    interval: "month",
    intervalCount: 6,
    monthlyEquivalentCents: 1250,
    savingsPercent: 17,
  },
  {
    id: "12mo",
    priceId: process.env.STRIPE_PRICE_12MO ?? "",
    label: "12 months",
    amountCents: 12999,
    interval: "year",
    intervalCount: 1,
    monthlyEquivalentCents: 1083,
    savingsPercent: 28,
  },
] as const;

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function priceIdToPlan(priceId: string): Plan | undefined {
  return PLANS.find((p) => p.priceId === priceId);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
