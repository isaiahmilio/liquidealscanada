import { Link } from 'react-router-dom';
import { formatCents, savingsPercent } from '../lib/pricing';
import type { PublicListing } from '../lib/types';
import { FavoriteButton } from './FavoriteButton';

const HOURS_48 = 48 * 60 * 60 * 1000;

export function ListingCard({ listing }: { listing: PublicListing }) {
  const savings = savingsPercent(listing.retailPriceCents, listing.listedPriceCents);
  const isHot = savings >= 40;
  const isNew = Date.now() - new Date(listing.createdAt).getTime() < HOURS_48;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex flex-col bg-white rounded-xl border border-slate-200 hover:border-maple-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
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

        {/* Savings badge */}
        {savings > 0 && (
          <span className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm ${
            isHot ? 'bg-maple-500' : 'bg-brand-600'
          }`}>
            -{savings}% off
          </span>
        )}

        {/* HOT badge */}
        {isHot && (
          <span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-extrabold px-2 py-0.5 rounded-lg shadow-sm tracking-wide">
            HOT
          </span>
        )}

        {/* Recently added badge */}
        {isNew && (
          <span className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-lg shadow-sm tracking-wide">
            Recently added
          </span>
        )}

        {/* Hover preview — desktop only */}
        {(listing.condition || listing.description) && (
          <div className="hidden md:flex pointer-events-none absolute inset-x-0 bottom-0 flex-col gap-1.5 px-3 py-3 bg-gradient-to-t from-black/75 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out">
            {listing.condition && (
              <span className="self-start text-[10px] font-semibold bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {listing.condition}
              </span>
            )}
            {listing.description && (
              <p className="text-white text-xs leading-snug line-clamp-2 drop-shadow">
                {listing.description}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
          {listing.title}
        </h3>

        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-lg font-bold text-slate-900">
            {formatCents(listing.listedPriceCents)}
          </span>
          {listing.retailPriceCents > listing.listedPriceCents && (
            <span className="text-xs text-slate-400 line-through">
              {formatCents(listing.retailPriceCents)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-0.5">
          {listing.category ? (
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {listing.category}
            </span>
          ) : <span />}
          <FavoriteButton listingId={listing.id} />
        </div>
      </div>
    </Link>
  );
}
