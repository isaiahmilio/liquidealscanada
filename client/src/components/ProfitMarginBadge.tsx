import { profitMarginPercent } from '../lib/pricing';

export function ProfitMarginBadge({ listedCents, costCents }: { listedCents: number; costCents: number }) {
  const margin = profitMarginPercent(listedCents, costCents);
  const isLoss = margin < 0;
  const colour = isLoss
    ? 'bg-red-50 text-red-700 border-red-200'
    : margin < 20
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-brand-50 text-brand-700 border-brand-200';
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded border ${colour}`}>
      Margin: {margin}%
    </span>
  );
}
