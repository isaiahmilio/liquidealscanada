import { useState } from 'react';
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

export function Browse() {
  const [activeCategory, setActiveCategory] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', 'browse'],
    queryFn: () => api.get<ListingsPage>('/api/listings'),
  });

  const filtered = activeCategory
    ? (data?.listings ?? []).filter((l) => l.category === activeCategory)
    : (data?.listings ?? []);

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
      <HeroBanner total={data.total} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap mb-6">
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

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{filtered.length}</span>{' '}
            {activeCategory ? `${activeCategory} deal${filtered.length !== 1 ? 's' : ''}` : `deal${filtered.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">😔</div>
            <p className="text-slate-600 font-medium">No {activeCategory} deals right now.</p>
            <button
              onClick={() => setActiveCategory('')}
              className="mt-3 text-sm text-maple-500 hover:underline font-medium"
            >
              View all deals
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

function HeroBanner({ total }: { total: number | null }) {
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
              <span className="inline-flex items-center gap-2 bg-white text-maple-600 font-bold px-5 py-2.5 rounded-xl text-sm shadow-md">
                🏷️ {total} deal{total !== 1 ? 's' : ''} available now
              </span>
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
