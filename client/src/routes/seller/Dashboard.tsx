import { useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { OwnerListing } from '../../lib/types';
import { useAuth } from '../../lib/auth';
import { formatCents, savingsPercent } from '../../lib/pricing';
import { ProfitMarginBadge } from '../../components/ProfitMarginBadge';

const STATUS_STYLES: Record<string, string> = {
  LIVE:  'bg-green-50 text-green-700 border border-green-200',
  DRAFT: 'bg-amber-50 text-amber-700 border border-amber-200',
  SOLD:  'bg-slate-100 text-slate-500 border border-slate-200',
};

export function SellerDashboard() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [removing, setRemoving] = useState<string | null>(null);
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { data, isLoading } = useQuery({
    queryKey: ['seller', 'listings'],
    queryFn: () => api.get<{ listings: OwnerListing[] }>('/api/seller/listings'),
    enabled: !!user,
  });

  if (loading)   return <p className="text-slate-500 p-6">Loading…</p>;
  if (!user)     return <Navigate to="/login" replace />;
  if (isLoading) return <p className="text-slate-500 p-6">Loading your listings…</p>;

  const listings = (data?.listings ?? []).filter((l) => l.status !== 'REMOVED');

  async function confirmRemove(id: string) {
    setRemoving(id);
    try {
      await api.del(`/api/listings/${id}`);
      qc.setQueryData<{ listings: OwnerListing[] }>(['seller', 'listings'], (old) =>
        old ? { listings: old.listings.filter((l) => l.id !== id) } : old
      );
    } finally {
      setRemoving(null);
    }
  }

  function startRemoval(id: string) {
    if (pendingRemovals.has(id) || removing === id) return;
    setPendingRemovals((prev) => new Set([...prev, id]));
    const t = setTimeout(() => {
      timeoutsRef.current.delete(id);
      setPendingRemovals((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      confirmRemove(id);
    }, 5000);
    timeoutsRef.current.set(id, t);
  }

  function cancelRemoval(id: string) {
    const t = timeoutsRef.current.get(id);
    if (t) { clearTimeout(t); timeoutsRef.current.delete(id); }
    setPendingRemovals((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {listings.length} listing{listings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/seller/new"
          className="inline-flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2.5 rounded-lg hover:bg-brand-700 active:scale-95 transition font-medium text-sm shadow-sm"
        >
          + New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-slate-700 font-semibold mb-1">No listings yet</p>
          <p className="text-sm text-slate-400 mb-6">
            Your items will appear here once you add them.
          </p>
          <Link
            to="/seller/new"
            className="inline-flex items-center gap-1 text-brand-700 font-medium hover:underline text-sm"
          >
            List your first item →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((l) => {
            const isPending  = pendingRemovals.has(l.id);
            const isRemoving = removing === l.id;

            return (
              <div
                key={l.id}
                className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                  isPending
                    ? 'border-red-200 bg-red-50 shadow-sm'
                    : isRemoving
                    ? 'border-slate-200 bg-slate-50 opacity-50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {isPending && (
                  <div className="absolute bottom-0 left-0 h-1 bg-red-400 animate-countdown-bar rounded-b-xl" />
                )}

                <div className="flex items-center gap-4 p-4">
                  <div className="flex-shrink-0">
                    {l.photoUrl ? (
                      <img
                        src={l.photoUrl}
                        alt={l.title}
                        className="w-16 h-16 rounded-lg object-cover bg-slate-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{l.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          STATUS_STYLES[l.status] ?? 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {formatCents(l.listedPriceCents)}
                      </span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="line-through text-slate-400">
                        {formatCents(l.retailPriceCents)}
                      </span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="text-green-600 font-medium">
                        {savingsPercent(l.retailPriceCents, l.listedPriceCents)}% off
                      </span>
                    </p>
                    {l.category && (
                      <p className="text-xs text-slate-400 mt-0.5">{l.category}</p>
                    )}
                  </div>

                  <ProfitMarginBadge
                    listedCents={l.listedPriceCents}
                    costCents={l.costCents}
                  />

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPending ? (
                      <>
                        <span className="text-sm text-red-500 font-medium animate-pulse select-none">
                          Removing…
                        </span>
                        <button
                          onClick={() => cancelRemoval(l.id)}
                          className="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 active:scale-95 transition text-slate-700 font-medium shadow-sm"
                        >
                          Undo
                        </button>
                      </>
                    ) : isRemoving ? (
                      <span className="text-sm text-slate-400 select-none">Deleting…</span>
                    ) : (
                      <>
                        <Link
                          to={`/seller/listings/${l.id}/edit`}
                          className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 transition text-slate-700 font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => startRemoval(l.id)}
                          className="text-sm px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 active:scale-95 transition text-red-600 font-medium"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
