import { useState } from 'react';
import type { ListingPhoto } from '../lib/types';

interface Props {
  photos: ListingPhoto[];
  alt: string;
}

export function PhotoGallery({ photos, alt }: Props) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="w-full aspect-square flex items-center justify-center text-slate-300 text-7xl bg-slate-50 rounded-2xl border border-slate-200">
        📦
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <img
          src={photos[active].url}
          alt={alt}
          className="w-full h-auto object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-maple-500' : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
