import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCents, savingsPercent } from '../lib/pricing';
import type { PublicListing, OwnerListing } from '../lib/types';
import { useAuth } from '../lib/auth';
import { ProfitMarginBadge } from '../components/ProfitMarginBadge';
import { FavoriteButton } from '../components/FavoriteButton';
import { PhotoGallery } from '../components/PhotoGallery';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get<{ listing: PublicListing | OwnerListing }>(`/api/listings/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
        <div className="rounded-2xl bg-slate-200 aspect-square" />
        <div className="space-y-4 pt-2">
          <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
          <div className="h-5 bg-slate-100 rounded w-1/4" />
          <div className="h-12 bg-slate-200 rounded-lg w-1/2" />
          <div className="h-24 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Listing not found</h2>
        <p className="text-slate-500 mb-6">This item may have been removed or sold.</p>
        <Link to="/" className="bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700 font-medium transition shadow-sm">
          Browse all deals
        </Link>
      </div>
    );
  }

  const listing = data.listing;
  const savings = savingsPercent(listing.retailPriceCents, listing.listedPriceCents);
  const isOwner = user?.id === listing.sellerId;
  const ownerListing = isOwner ? (listing as OwnerListing) : null;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PhotoGallery photos={listing.photos ?? []} alt={listing.title} />

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {listing.category && (
                <span className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">
                  {listing.category}
                </span>
              )}
              {savings > 0 && (
                <span className="text-xs font-bold text-white bg-brand-600 px-2.5 py-1 rounded-full">
                  Save {savings}%
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">{listing.title}</h1>
            <FavoriteButton listingId={listing.id} className="flex-shrink-0 mt-1" />
          </div>

          {(listing.condition || listing.quantity > 1) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {listing.condition && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  listing.condition.startsWith('Brand New')
                    ? 'bg-green-100 text-green-700'
                    : listing.condition.startsWith('Like New')
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  ✦ {listing.condition}
                </span>
              )}
              {listing.quantity > 1 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {listing.quantity} in stock
                </span>
              )}
            </div>
          )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-brand-700">{formatCents(listing.listedPriceCents)}</span>
            {listing.retailPriceCents > listing.listedPriceCents && (
              <span className="text-xl text-slate-400 line-through">{formatCents(listing.retailPriceCents)}</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              {listing.viewCount.toLocaleString()} {listing.viewCount === 1 ? 'view' : 'views'}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              {listing.favoriteCount.toLocaleString()} {listing.favoriteCount === 1 ? 'person saved this' : 'people saved this'}
            </span>
          </div>

          {ownerListing && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Seller view — only visible to you</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <span>Cost: <strong>{formatCents(ownerListing.costCents)}</strong></span>
                <span>Suggested: <strong>{formatCents(ownerListing.suggestedPriceCents)}</strong></span>
                <ProfitMarginBadge listedCents={ownerListing.listedPriceCents} costCents={ownerListing.costCents} />
              </div>
              {isOwner && (
                <Link
                  to={`/seller/listings/${listing.id}/edit`}
                  className="inline-block mt-1 text-xs text-amber-700 font-medium hover:underline"
                >
                  Edit listing →
                </Link>
              )}
            </div>
          )}

          {listing.description && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Description</h2>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
            </div>
          )}

          {listing.priceSources.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Compare to retail</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {listing.priceSources.map((s, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-3 text-sm">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">
                        {s.retailer}
                      </a>
                    ) : (
                      <span className="text-slate-600 font-medium">{s.retailer}</span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{formatCents(s.priceCents)}</span>
                      {s.priceCents > listing.listedPriceCents && (
                        <span className="text-xs text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                          You save {formatCents(s.priceCents - listing.listedPriceCents)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isOwner && (
            <div className="pt-2">
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-600 mb-1">Interested in this item?</p>
                <p className="text-xs text-slate-400">Contact the seller through your preferred channel to arrange purchase.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
