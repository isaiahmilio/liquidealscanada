import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ListingsPage } from '../lib/types';
import { ListingCard } from '../components/ListingCard';

const CATEGORIES = [
  { label: 'All Deals',   emoji: '🏷️', value: '' },
  { label: 'Electronics', emoji: '📱', value: 'Electronics' },
  { label: 'Gaming',      emoji: '🎮', value: 'Gaming' },
  { label: 'Home',        emoji: '🏠', value: 'Home' },
  { label: 'Kitchen',     emoji: '🍳', value: 'Kitchen' },
  { label: 'Clothing',    emoji: '👕', value: 'Clothing' },
  { label: 'Beauty',      emoji: '💄', value: 'Beauty' },
  { label: 'Tools',       emoji: '🔧', value: 'Tools' },
  { label: 'Toys',        emoji: '🧸', value: 'Toys' },
  { label: 'Sports',      emoji: '⚽', value: 'Sports' },
  { label: 'Office',      emoji: '🖊️', value: 'Office' },
  { label: 'Other',       emoji: '📦', value: 'Other' },
];

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'most_viewed' | 'discount';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',      label: 'Newest' },
  { value: 'price_asc',   label: 'Price ↑' },
  { value: 'price_desc',  label: 'Price ↓' },
  { value: 'most_viewed', label: 'Most viewed' },
  { value: 'discount',    label: 'Biggest discount' },
];

export function Browse() {
  const [activeCategory, setActiveCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');

  // Debounce: wait 350ms after typing stops before hitting the server
  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (activeCategory) params.set('category', activeCategory);
  if (sort !== 'newest') params.set('sort', sort);
  const qs = params.toString();

  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', 'browse', q, activeCategory, sort],
    queryFn: () => api.get<ListingsPage>(`/api/listings${qs ? `?${qs}` : ''}`),
  });

  const filtered = data?.listings ?? [];

  if (isLoading) {
    return (
      <div>
        <HeroBanner total={null} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 overflow-hidden bg-white animate-pulse">
                <div className="aspect-square bg-slate-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-slate-200 rounded" />
                  <div className="h-5 w-20 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-600 font-semibold">Failed to load listings.</p>
        <p className="text-sm text-slate-400 mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!data || data.listings.length === 0) {
    return (
      <div>
        <HeroBanner total={0} />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white mx-8">
          <div className="text-5xl mb-4">🏷️</div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">No deals yet</h2>
          <p className="text-slate-500">Check back soon — new items are added daily across Canada.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner total={data.total} onScrollToDeals={() => document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })} />

      <div id="deals" className="max-w-6xl mx-auto px-4 py-8">

        {/* Search bar */}
        <div className="relative mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search deals — e.g. AirPods, vacuum, gaming…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-maple-500 focus:border-transparent placeholder:text-slate-400"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap mb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat.value
                  ? 'bg-maple-500 text-white border-maple-500 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-maple-300 hover:text-maple-600'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Sort pills */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-xs text-slate-400 font-medium pr-1">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                sort === opt.value
                  ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {isLoading ? (
              <span className="text-slate-400">Searching…</span>
            ) : (
              <>
                <span className="font-semibold text-slate-900">{data?.total ?? filtered.length}</span>{' '}
                {q
                  ? <>result{filtered.length !== 1 ? 's' : ''} for <strong className="text-slate-700">"{q}"</strong></>
                  : activeCategory
                  ? `${activeCategory} deal${filtered.length !== 1 ? 's' : ''}`
                  : `deal${filtered.length !== 1 ? 's' : ''} available`}
              </>
            )}
          </p>
          {(q || activeCategory) && (
            <button
              onClick={() => { setSearchInput(''); setActiveCategory(''); setSort('newest'); }}
              className="text-xs text-maple-500 hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {!isLoading && filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">{activeCategory ? '🏷️' : '🔍'}</div>
            <p className="text-slate-700 font-semibold text-lg mb-1">
              {activeCategory ? `No ${activeCategory} listings yet` : `No results found${q ? ` for "${q}"` : ''}`}
            </p>
            <p className="text-slate-400 text-sm mb-5">Check back soon — new items are added regularly.</p>
            <button
              onClick={() => { setSearchInput(''); setActiveCategory(''); setSort('newest'); }}
              className="inline-flex items-center gap-2 bg-maple-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-maple-600 active:scale-95 transition shadow-sm text-sm"
            >
              🏷️ Browse all deals
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HeroBanner({ total, onScrollToDeals }: { total: number | null; onScrollToDeals?: () => void }) {
  return (
    <div className="relative bg-maple-500 overflow-hidden">
      {/* Maple leaf watermark */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10 text-[18rem] leading-none select-none pointer-events-none pr-4">
        🍁
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-20">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            🇨🇦 Canada's Liquidation Marketplace
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-3">
            Deals from<br />Coast to Coast
          </h1>
          <p className="text-white/85 text-lg mb-6">
            Buy liquidation goods for up to <span className="font-bold text-white">90% off</span> retail price.
          </p>
          <div className="flex flex-wrap gap-3">
            {total !== null && total > 0 && (
              <button
                onClick={onScrollToDeals}
                className="inline-flex items-center gap-2 bg-white text-maple-600 font-bold px-5 py-2.5 rounded-xl text-sm shadow-md hover:bg-maple-50 active:scale-95 transition-all"
              >
                🏷️ {total} deal{total !== 1 ? 's' : ''} available now ↓
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="bg-maple-600 border-t border-maple-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-center sm:justify-start gap-x-8 gap-y-1 text-white/80 text-xs font-medium">
          <span className="flex items-center gap-1.5">🔒 Secure checkout</span>
          <span className="flex items-center gap-1.5">📦 New items added daily</span>
          <span className="flex items-center gap-1.5">💰 Discounted pricing</span>
          <span className="flex items-center gap-1.5">🍁 Canadian sellers</span>
        </div>
      </div>
    </div>
  );
}
