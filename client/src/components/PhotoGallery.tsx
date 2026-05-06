import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ListingPhoto } from '../lib/types';

interface Props {
  photos: ListingPhoto[];
  alt: string;
}

export function PhotoGallery({ photos, alt }: Props) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft')  setActive((a) => Math.max(0, a - 1));
      if (e.key === 'ArrowRight') setActive((a) => Math.min(photos.length - 1, a + 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="w-full aspect-square flex items-center justify-center text-slate-300 text-7xl bg-slate-50 rounded-2xl border border-slate-200">
        📦
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <img
            src={photos[active].url}
            alt={alt}
            onClick={() => setLightboxOpen(true)}
            className="w-full h-auto object-cover cursor-zoom-in"
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

      {lightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative animate-lightbox-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[active].url}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />

            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-lg hover:bg-slate-100 text-sm font-bold"
            >✕</button>

            {/* Prev */}
            {active > 0 && (
              <button
                onClick={() => setActive(active - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-lg backdrop-blur-sm transition"
              >‹</button>
            )}

            {/* Next */}
            {active < photos.length - 1 && (
              <button
                onClick={() => setActive(active + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-lg backdrop-blur-sm transition"
              >›</button>
            )}

            {/* Counter */}
            {photos.length > 1 && (
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                {active + 1} / {photos.length}
              </p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
