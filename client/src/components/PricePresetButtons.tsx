import { formatCents, preset30, preset50, suggestedFromRetail } from '../lib/pricing';

interface Props {
  retailCents: number;
  onPick: (cents: number) => void;
}

export function PricePresetButtons({ retailCents, onPick }: Props) {
  if (retailCents <= 0) return null;
  const presets = [
    { label: 'Suggested (60%)', cents: suggestedFromRetail(retailCents) },
    { label: '50% of retail',   cents: preset50(retailCents) },
    { label: '30% of retail',   cents: preset30(retailCents) },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => onPick(p.cents)}
          className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:border-brand-500 hover:bg-brand-50"
        >
          {p.label}: <strong>{formatCents(p.cents)}</strong>
        </button>
      ))}
    </div>
  );
}
