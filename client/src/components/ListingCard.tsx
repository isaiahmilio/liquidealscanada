import { Link } from 'react-router-dom';
import { formatCents, savingsPercent } from '../lib/pricing';
import type { PublicListing } from '../lib/types';

export function ListingCard({ listing }: { listing: PublicListing }) {
  const savings = savingsPercent(listing.retailPriceCents, listing.listedPriceCents);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex flex-col bg-white rounded-xl border border-slate-200 hover:border-brand-400 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="aspect-square bg-slate-100 overflow-hidden relative">
        {listing.photoUrl ? (
          <img
            src={listing.photoUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">
            📦
          </div>
        )}
        {savings > 0 && (
          <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
            -{savings}%
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-slate-900 truncate leading-snug">
          {listing.title}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">
            {formatCents(listing.listedPriceCents)}
          </span>
          {listing.retailPriceCents > listing.listedPriceCents && (
            <span className="text-xs text-slate-400 line-through">
              {formatCents(listing.retailPriceCents)}
            </span>
          )}
        </div>

        {listing.category && (
          <span className="self-start text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {listing.category}
          </span>
        )}
      </div>
    </Link>
  );
}
