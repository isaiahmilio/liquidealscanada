import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCents, savingsPercent } from '../lib/pricing';
import type { PublicListing, OwnerListing } from '../lib/types';
import { useAuth } from '../lib/auth';
import { ProfitMarginBadge } from '../components/ProfitMarginBadge';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get<{ listing: PublicListing | OwnerListing }>(`/api/listings/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error || !data) return <p className="text-red-600">Listing not found.</p>;

  const listing = data.listing;
  const savings = savingsPercent(listing.retailPriceCents, listing.listedPriceCents);
  const isOwner = user?.id === listing.sellerId;
  const ownerListing = isOwner ? (listing as OwnerListing) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
        {listing.photoUrl ? (
          <img
            src={listing.photoUrl}
            alt={listing.title}
            className="w-full h-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center text-slate-300 text-6xl bg-slate-50">📦</div>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-semibold mb-2">{listing.title}</h1>
        {listing.category && (
          <p className="text-sm text-slate-500 mb-4">{listing.category}</p>
        )}

        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-4xl font-bold text-brand-700">{formatCents(listing.listedPriceCents)}</span>
          {listing.retailPriceCents > listing.listedPriceCents && (
            <>
              <span className="text-lg text-slate-400 line-through">{formatCents(listing.retailPriceCents)}</span>
              <span className="bg-brand-600 text-white text-sm font-semibold px-2 py-1 rounded">Save {savings}%</span>
            </>
          )}
        </div>

        {ownerListing && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Seller view (only you can see this)</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span>Cost: <strong>{formatCents(ownerListing.costCents)}</strong></span>
              <span>Suggested: <strong>{formatCents(ownerListing.suggestedPriceCents)}</strong></span>
              <ProfitMarginBadge listedCents={ownerListing.listedPriceCents} costCents={ownerListing.costCents} />
            </div>
          </div>
        )}

        {listing.description && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Description</h2>
            <p className="text-slate-600 whitespace-pre-wrap">{listing.description}</p>
          </div>
        )}

        {listing.priceSources.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Compare to retail</h2>
            <ul className="space-y-1 text-sm">
              {listing.priceSources.map((s, i) => (
                <li key={i} className="flex justify-between text-slate-600">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-600">
                      {s.retailer}
                    </a>
                  ) : (
                    <span>{s.retailer}</span>
                  )}
                  <span>{formatCents(s.priceCents)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
