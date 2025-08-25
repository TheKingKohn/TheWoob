// Payment fee engine utility
// Works in integer cents, supports card/ach, gross-up, min/max, margin

export type PaymentMethod = "card" | "ach";

export interface FeeParams {
  priceCents: number;
  method?: PaymentMethod;
  marginBps: number; // basis points (e.g. 500 = 5%)
  marginFixedCents: number;
  minCents: number;
  maxCents: number;
}

export interface FeeResult {
  feeCents: number;
  totalCents: number;
  platformMarginCents: number;
}

export function computeFee({
  priceCents,
  method = "card",
  marginBps,
  marginFixedCents,
  minCents,
  maxCents,
}: FeeParams): FeeResult {
  // Emergency feature flag disables all fees
  if (process.env.FEES_DISABLE === "true") {
    return {
      feeCents: 0,
      totalCents: priceCents,
      platformMarginCents: 0,
    };
  }

  // Stripe/card: r=2.9% (0.029), f=30c
  // ACH: r=0.8% (0.008), f=0c, r-part capped at $5 (500c)
  let r = method === "ach" ? 0.008 : 0.029;
  let f = method === "ach" ? 0 : 30;
  let rPartCents = Math.ceil(r * priceCents);
  if (method === "ach" && rPartCents > 500) rPartCents = 500;

  // Platform margin
  const marginCents = Math.floor((marginBps / 10000) * priceCents) + marginFixedCents;

  // Gross-up: S = ((marginCents + rPartCents + f)) / (1 - r)
  // But we want fee on price+fee, so solve for fee:
  // fee = ceil((marginCents + rPartCents + f) / (1 - r))
  const numerator = marginCents + rPartCents + f;
  const denominator = 1 - r;
  let feeCents = Math.ceil(numerator / denominator);

  // Enforce min/max
  if (feeCents < minCents) feeCents = minCents;
  if (feeCents > maxCents) feeCents = maxCents;

  const totalCents = priceCents + feeCents;

  return {
    feeCents,
    totalCents,
    platformMarginCents: marginCents,
  };
}

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
