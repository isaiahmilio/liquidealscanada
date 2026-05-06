import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatCents, savingsPercent } from '../lib/pricing';

interface FavoriteListing {
  id: string;
  title: string;
  status: string;
  category: string | null;
  photoUrl: string | null;
  listedPriceCents: number;
  retailPriceCents: number;
}

interface FavoriteEntry {
  id: string;
  listingId: string;
  createdAt: string;
  listing: FavoriteListing;
}

export function Favorites() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get<{ favorites: FavoriteEntry[] }>('/api/favorites'),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const favorites = data?.favorites ?? [];

  if (favorites.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-5xl mb-4">🤍</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No saved deals yet</h2>
        <p className="text-slate-500 mb-6">Tap the heart on any listing to save it here.</p>
        <Link
          to="/"
          className="bg-maple-500 text-white px-5 py-2.5 rounded-lg hover:bg-maple-600 font-medium transition shadow-sm"
        >
          Browse deals
        </Link>
      </div>
    );
  }

  const live = favorites.filter((f) => f.listing.status === 'LIVE');
  const sold = favorites.filter((f) => f.listing.status !== 'LIVE');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Saved Deals</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {live.length} saved item{live.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3">
        {live.map((fav) => (
          <FavoriteRow key={fav.id} fav={fav} />
        ))}
        {sold.map((fav) => (
          <SoldFavoriteRow key={fav.id} fav={fav} />
        ))}
      </div>
    </div>
  );
}

function FavoriteRow({ fav }: { fav: FavoriteEntry }) {
  const savings = savingsPercent(fav.listing.retailPriceCents, fav.listing.listedPriceCents);
  const qc = useQueryClient();

  function remove() {
    api.del(`/api/favorites/${fav.listingId}`).catch(() => {});
    qc.setQueryData<{ favorites: FavoriteEntry[] }>(['favorites'], (old) =>
      old ? { favorites: old.favorites.filter((f) => f.id !== fav.id) } : old
    );
  }

  return (
    <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all">
      <Link to={`/listings/${fav.listingId}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-100 overflow-hidden">
          {fav.listing.photoUrl ? (
            <img src={fav.listing.photoUrl} alt={fav.listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{fav.listing.title}</p>
          {fav.listing.category && (
            <p className="text-xs text-slate-400 mt-0.5">{fav.listing.category}</p>
          )}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-bold text-slate-900">{formatCents(fav.listing.listedPriceCents)}</span>
            {savings > 0 && (
              <>
                <span className="text-xs text-slate-400 line-through">{formatCents(fav.listing.retailPriceCents)}</span>
                <span className="text-xs font-semibold text-brand-600">-{savings}% off</span>
              </>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={remove}
        className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors p-1"
        title="Remove from saved"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

function SoldFavoriteRow({ fav }: { fav: FavoriteEntry }) {
  const [visible, setVisible] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), 3500);
    const removeTimer = setTimeout(() => {
      api.del(`/api/favorites/${fav.listingId}`).catch(() => {});
      qc.setQueryData<{ favorites: FavoriteEntry[] }>(['favorites'], (old) =>
        old ? { favorites: old.favorites.filter((f) => f.id !== fav.id) } : old
      );
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div
      className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-200 overflow-hidden opacity-50">
        {fav.listing.photoUrl ? (
          <img src={fav.listing.photoUrl} alt={fav.listing.title} className="w-full h-full object-cover grayscale" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-400 truncate line-through">{fav.listing.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-bold text-white bg-slate-400 px-2 py-0.5 rounded-full">SOLD</span>
          <span className="text-xs text-slate-400 animate-pulse">Removing from saved…</span>
        </div>
      </div>
    </div>
  );
}
