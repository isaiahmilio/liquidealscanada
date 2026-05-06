import { formatCents } from '../lib/pricing';

interface Props {
  retailCents: number;
  onPick: (cents: number) => void;
  selectedCents?: number;
}

const PRESETS = [
  { offPct: 0,   label: '0% off' },
  { offPct: 10,  label: '10% off' },
  { offPct: 20,  label: '20% off' },
  { offPct: 30,  label: '30% off' },
  { offPct: 40,  label: '40% off ★' },
  { offPct: 50,  label: '50% off' },
  { offPct: 60,  label: '60% off' },
  { offPct: 70,  label: '70% off' },
  { offPct: 80,  label: '80% off' },
  { offPct: 90,  label: '90% off' },
  { offPct: 100, label: '100% off' },
];

export function PricePresetButtons({ retailCents, onPick, selectedCents }: Props) {
  if (retailCents <= 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => {
        const cents = Math.round(retailCents * (1 - p.offPct / 100));
        const isActive = selectedCents !== undefined && Math.abs(selectedCents - cents) < 2;
        return (
          <button
            key={p.offPct}
            type="button"
            onClick={() => onPick(cents)}
            className={`flex flex-col items-center px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isActive
                ? 'bg-maple-500 border-maple-500 text-white shadow-sm'
                : p.offPct === 40
                ? 'border-brand-300 text-brand-700 bg-brand-50 hover:bg-brand-100'
                : 'border-slate-200 text-slate-600 hover:border-maple-300 hover:bg-maple-50 hover:text-maple-700'
            }`}
          >
            <span className="font-bold">{p.label}</span>
            <span className="opacity-80">{formatCents(cents)}</span>
          </button>
        );
      })}
    </div>
  );
}
