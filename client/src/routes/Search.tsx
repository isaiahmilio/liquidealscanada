import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ListingsPage } from '../lib/types';
import { ListingCard } from '../components/ListingCard';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [input, setInput] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ['listings', 'search', q],
    queryFn: () => api.get<ListingsPage>(`/api/listings?q=${encodeURIComponent(q)}`),
    enabled: q.length > 0,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSearchParams(input.trim() ? { q: input.trim() } : {});
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Search deals</h1>
        <p className="text-sm text-slate-500">Find liquidation items across Canada</p>
      </div>

      <form onSubmit={onSubmit} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. AirPods, KitchenAid, Nintendo Switch…"
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 font-medium transition active:scale-95 shadow-sm flex-shrink-0"
        >
          Search
        </button>
      </form>

      {!q && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔎</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">What are you looking for?</h2>
          <p className="text-slate-400 text-sm">Type a product name above to find great deals.</p>
        </div>
      )}

      {q && isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="aspect-square bg-slate-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-200 rounded" />
                <div className="h-5 w-20 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {q && !isLoading && data && (
        data.listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😔</div>
            <h2 className="text-lg font-semibold text-slate-700 mb-1">No results for &ldquo;{q}&rdquo;</h2>
            <p className="text-slate-400 text-sm">Try a different search term or browse all deals.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              <strong className="text-slate-900">{data.total}</strong> result{data.total === 1 ? '' : 's'} for &ldquo;{q}&rdquo;
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </>
        )
      )}
    </div>
  );
}
