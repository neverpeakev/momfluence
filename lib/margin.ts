// MomFluence's offer-broker margin. The displayed payout is what the momfluencer
// earns; the gross is what the upstream network pays MomFluence.
//
// margin_bps is stored on each offer (default 1000 = 10%). We compute net payout
// at link-creation time by storing it derived from the offer at that moment, so
// margin changes never retroactively affect existing links/conversions.

export function netPayoutCents(grossCents: number, marginBps: number): number {
  if (grossCents < 0 || marginBps < 0 || marginBps > 10000) {
    throw new Error(`invalid margin inputs: gross=${grossCents} margin=${marginBps}`);
  }
  // round DOWN to favor the platform on fractional cents (creator never short
  // by more than $0.01 vs round-half-even, but compounding stays positive).
  return Math.floor((grossCents * (10000 - marginBps)) / 10000);
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
