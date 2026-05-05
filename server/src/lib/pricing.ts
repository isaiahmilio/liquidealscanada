// Mirror of client/src/lib/pricing.ts. Keep these in sync.

export const savingsPercent = (retailCents: number, listedCents: number): number => {
  if (retailCents <= 0) return 0;
  return Math.max(0, Math.round(((retailCents - listedCents) / retailCents) * 100));
};

export const profitMarginPercent = (listedCents: number, costCents: number): number => {
  if (listedCents <= 0) return 0;
  return Math.round(((listedCents - costCents) / listedCents) * 100);
};

export const suggestedFromRetail = (retailCents: number): number => Math.round(retailCents * 0.6);
