// Shared pricing math. Mirror of server/src/lib/pricing.ts.
// Keep these two files in sync — they are intentionally duplicated for now.

export const formatCents = (cents: number): string =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100);

export const savingsPercent = (retailCents: number, listedCents: number): number => {
  if (retailCents <= 0) return 0;
  return Math.max(0, Math.round(((retailCents - listedCents) / retailCents) * 100));
};

export const profitMarginPercent = (listedCents: number, costCents: number): number => {
  if (listedCents <= 0) return 0;
  return Math.round(((listedCents - costCents) / listedCents) * 100);
};

export const suggestedFromRetail = (retailCents: number): number => Math.round(retailCents * 0.6);
export const preset50              = (retailCents: number): number => Math.round(retailCents * 0.5);
export const preset30              = (retailCents: number): number => Math.round(retailCents * 0.3);
