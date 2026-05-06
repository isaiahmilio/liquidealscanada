import { formatCents } from '../lib/pricing';

interface Props {
  retailCents: number;
  onPick: (cents: number) => void;
  selectedCents?: number;
}

const PRESETS = [
  { offPct: 0   },
  { offPct: 10  },
  { offPct: 20  },
  { offPct: 30  },
  { offPct: 40  },
  { offPct: 50  },
  { offPct: 60  },
  { offPct: 70  },
  { offPct: 80  },
  { offPct: 90  },
  { offPct: 100 },
];

export function PricePresetButtons({ retailCents, onPick, selectedCents }: Props) {
  if (retailCents <= 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => {
        const cents = Math.round(retailCents * (1 - p.offPct / 100));
        const isActive = selectedCents !== undefined && Math.abs(selectedCents - cents) < 2;
        const isHot = p.offPct >= 50;
        return (
          <button
            key={p.offPct}
            type="button"
            onClick={() => onPick(cents)}
            className={`flex flex-col items-center px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isActive
                ? 'bg-maple-500 border-maple-500 text-white shadow-sm'
                : isHot
                ? 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'border-slate-200 text-slate-600 hover:border-maple-300 hover:bg-maple-50 hover:text-maple-700'
            }`}
          >
            <span className="font-bold flex items-center gap-0.5">
              {isHot && <span className={isActive ? 'text-white' : 'text-emerald-500'}>★</span>}
              {p.offPct}% off
            </span>
            <span className="opacity-80">{formatCents(cents)}</span>
          </button>
        );
      })}
    </div>
  );
}
