import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import type { OwnerListing } from '../../lib/types';
import { PricePresetButtons } from '../../components/PricePresetButtons';
import { ProfitMarginBadge } from '../../components/ProfitMarginBadge';
import { formatCents, savingsPercent } from '../../lib/pricing';

export function EditListing() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id, 'owner'],
    queryFn: () => api.get<{ listing: OwnerListing }>(`/api/listings/${id}`),
    enabled: !!id && !!user,
  });

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('');
  const [cost, setCost]               = useState(0);
  const [listed, setListed]           = useState(0);

  useEffect(() => {
    if (!data) return;
    setTitle(data.listing.title);
    setDescription(data.listing.description ?? '');
    setCategory(data.listing.category ?? '');
    setCost(data.listing.costCents / 100);
    setListed(data.listing.listedPriceCents / 100);
  }, [data]);

  if (loading || isLoading) return <p className="text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!data) return <p className="text-red-600">Not found.</p>;

  const listing = data.listing;
  const listedCents = Math.round(listed * 100);
  const costCents   = Math.round(cost * 100);

  async function save(patch: Partial<OwnerListing>) {
    try {
      await api.patch(`/api/listings/${id}`, patch);
      qc.invalidateQueries({ queryKey: ['seller', 'listings'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function setStatus(status: OwnerListing['status']) {
    await save({ status });
    nav('/seller');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Edit listing</h1>
      {error && <p className="text-red-600">{error}</p>}

      <div className="flex gap-4 bg-white rounded-lg border border-slate-200 p-4">
        <img src={listing.photoUrl} alt="" className="w-32 h-32 object-cover rounded" />
        <div className="flex-1 text-sm text-slate-600">
          <p>Status: <strong>{listing.status}</strong></p>
          <p>Retail avg: {formatCents(listing.retailPriceCents)}</p>
          <p>Suggested: {formatCents(listing.suggestedPriceCents)}</p>
          <p>Buyers see: save {savingsPercent(listing.retailPriceCents, listedCents)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
        <Field label="Title" value={title} onChange={setTitle} onBlur={() => save({ title })} />
        <Field label="Description" value={description} onChange={setDescription} onBlur={() => save({ description })} multiline />
        <Field label="Category" value={category} onChange={setCategory} onBlur={() => save({ category })} />

        <NumField label="Your cost (CAD)" value={cost} onChange={setCost} onBlur={() => save({ costCents })} />
        <NumField label="Listed price (CAD)" value={listed} onChange={setListed} onBlur={() => save({ listedPriceCents: listedCents })} />
        <PricePresetButtons retailCents={listing.retailPriceCents} onPick={(c) => { setListed(c / 100); save({ listedPriceCents: c }); }} />

        <ProfitMarginBadge listedCents={listedCents} costCents={costCents} />
      </div>

      <div className="flex flex-wrap gap-3 justify-end">
        {listing.status === 'DRAFT' && (
          <button onClick={() => setStatus('LIVE')} className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700">Publish</button>
        )}
        {listing.status === 'LIVE' && (
          <button onClick={() => setStatus('SOLD')} className="bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-800">Mark as sold</button>
        )}
        <button onClick={() => setStatus('REMOVED')} className="border border-red-300 text-red-700 px-4 py-2 rounded-md hover:bg-red-50">Remove listing</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, onBlur, multiline }: { label: string; value: string; onChange: (v: string) => void; onBlur: () => void; multiline?: boolean }) {
  const cls = "mt-1 block w-full rounded-md border-slate-300 border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500";
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      {multiline
        ? <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className={cls} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className={cls} />}
    </label>
  );
}

function NumField({ label, value, onChange, onBlur }: { label: string; value: number; onChange: (v: number) => void; onBlur: () => void }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onBlur={onBlur}
        className="mt-1 block w-full rounded-md border-slate-300 border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </label>
  );
}
