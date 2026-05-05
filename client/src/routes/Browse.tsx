import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ListingsPage } from '../lib/types';
import { ListingCard } from '../components/ListingCard';

export function Browse() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', 'browse'],
    queryFn: () => api.get<ListingsPage>('/api/listings'),
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="aspect-square bg-slate-200 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-20 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-medium">Failed to load listings.</p>
        <p className="text-sm text-slate-400 mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!data || data.listings.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🏷️</div>
        <h1 className="text-2xl font-bold mb-2 text-slate-900">No deals yet</h1>
        <p className="text-slate-500">Check back soon — new items are added every day.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Today's Deals</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {data.total} item{data.total === 1 ? '' : 's'} available across Canada
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {data.listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </div>
  );
}
