import { computeFee, formatUSD } from "./fees";
import { describe, it, expect } from "vitest";

describe("computeFee", () => {
  it("card $20, 5% + $1.30", () => {
    const res = computeFee({ priceCents: 2000, method: "card", marginBps: 500, marginFixedCents: 130, minCents: 0, maxCents: 99999 });
    expect(res.feeCents).toBeGreaterThanOrEqual(328);
    expect(res.platformMarginCents).toBe(230);
  });

  it("card $50, 5% + $1.30", () => {
    const res = computeFee({ priceCents: 5000, method: "card", marginBps: 500, marginFixedCents: 130, minCents: 0, maxCents: 99999 });
    expect(res.feeCents).toBeGreaterThanOrEqual(572);
    expect(res.platformMarginCents).toBe(380);
  });

  it("card $10, min fee $1", () => {
    const res = computeFee({ priceCents: 1000, method: "card", marginBps: 500, marginFixedCents: 130, minCents: 100, maxCents: 99999 });
    expect(res.feeCents).toBeGreaterThanOrEqual(100);
  });

  it("card $100, max fee $10", () => {
    const res = computeFee({ priceCents: 10000, method: "card", marginBps: 500, marginFixedCents: 130, minCents: 0, maxCents: 1000 });
    expect(res.feeCents).toBeLessThanOrEqual(1000);
  });

  it("ach $200, 5% + $1.30, cap r-part at $5", () => {
    const res = computeFee({ priceCents: 20000, method: "ach", marginBps: 500, marginFixedCents: 130, minCents: 0, maxCents: 99999 });
    // r-part capped at $5 (500c)
    expect(res.feeCents).toBeGreaterThanOrEqual(646);
    expect(res.platformMarginCents).toBe(1130);
  });

  it("formatUSD helper", () => {
    expect(formatUSD(123)).toBe("$1.23");
    expect(formatUSD(100)).toBe("$1.00");
    expect(formatUSD(0)).toBe("$0.00");
  });
});
