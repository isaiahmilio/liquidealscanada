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
    setSearchParams(input ? { q: input } : {});
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="mb-6 flex gap-2">
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search for products"
          className="flex-1 rounded-md border-slate-300 border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700">
          Search
        </button>
      </form>

      {!q && <p className="text-slate-500">Type something to search.</p>}
      {q && isLoading && <p className="text-slate-500">Searching…</p>}
      {q && data && (
        data.listings.length === 0 ? (
          <p className="text-slate-500">No results for &ldquo;{q}&rdquo;.</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">{data.total} result{data.total === 1 ? '' : 's'} for &ldquo;{q}&rdquo;</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </>
        )
      )}
    </div>
  );
}
