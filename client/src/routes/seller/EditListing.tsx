import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import type { OwnerListing } from '../../lib/types';
import { PricePresetButtons } from '../../components/PricePresetButtons';
import { ProfitMarginBadge } from '../../components/ProfitMarginBadge';
import { formatCents } from '../../lib/pricing';

const CATEGORIES = ['Electronics', 'Gaming', 'Home', 'Kitchen', 'Clothing', 'Beauty', 'Tools', 'Toys', 'Sports', 'Office', 'Other'];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  LIVE:  'Live',
  SOLD:  'Sold',
};

export function EditListing() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id, 'owner'],
    queryFn: () => api.get<{ listing: OwnerListing }>(`/api/listings/${id}`),
    enabled: !!id && !!user,
  });

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('');
  const [condition, setCondition]     = useState('');
  const [cost, setCost]               = useState(0);
  const [listed, setListed]           = useState(0);

  useEffect(() => {
    if (!data) return;
    setTitle(data.listing.title);
    setDescription(data.listing.description ?? '');
    setCategory(data.listing.category ?? '');
    setCondition(data.listing.condition ?? '');
    setCost(data.listing.costCents / 100);
    setListed(data.listing.listedPriceCents / 100);
  }, [data]);

  if (loading || isLoading) return <p className="text-slate-500 p-6">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!data) return <p className="text-red-600 p-6">Listing not found.</p>;

  const listing = data.listing;
  const listedCents = Math.round(listed * 100);
  const costCents   = Math.round(cost * 100);

  async function save(patch: Partial<OwnerListing>) {
    setSaving(true);
    try {
      await api.patch(`/api/listings/${id}`, patch);
      qc.invalidateQueries({ queryKey: ['seller', 'listings'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    await save({ title, description, category, condition: condition || undefined, costCents, listedPriceCents: listedCents });
  }

  async function setStatus(status: OwnerListing['status']) {
    await save({ status });
    nav('/seller');
  }

  async function uploadPhoto(file: File) {
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await api.post(`/api/listings/${id}/photos`, fd);
      qc.invalidateQueries({ queryKey: ['listing', id, 'owner'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Photo upload failed');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function deletePhoto(photoId: string) {
    try {
      await api.del(`/api/listings/${id}/photos/${photoId}`);
      qc.invalidateQueries({ queryKey: ['listing', id, 'owner'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Edit listing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Changes save when you click Save</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          listing.status === 'LIVE'  ? 'bg-green-100 text-green-700' :
          listing.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                                       'bg-slate-100 text-slate-500'
        }`}>
          {STATUS_LABEL[listing.status] ?? listing.status}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">⚠️ {error}</p>
      )}

      {/* Photos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Photos</p>
          {(listing.photos ?? []).length < 10 && (
            <>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="text-xs text-maple-600 font-medium hover:underline disabled:opacity-50"
              >
                {photoUploading ? 'Uploading…' : '+ Add photo'}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ''; }}
              />
            </>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {listing.photoUrl && (
            <div className="relative">
              <img src={listing.photoUrl} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
              <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-maple-500 text-white rounded px-1">Main</span>
            </div>
          )}
          {(listing.photos ?? []).map((p) => (
            <div key={p.id} className="relative">
              <img src={p.url} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
              <button
                type="button"
                onClick={() => deletePhoto(p.id)}
                className="absolute -top-1.5 -right-1.5 bg-white border border-slate-300 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-50 hover:text-red-600 shadow-sm leading-none"
              >✕</button>
            </div>
          ))}
          {!listing.photoUrl && (listing.photos ?? []).length === 0 && (
            <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">📦</div>
          )}
        </div>
        <div className="text-xs text-slate-400">
          Retail avg: <strong className="text-slate-600">{formatCents(listing.retailPriceCents)}</strong>
          {' · '}AI suggested: <strong className="text-slate-600">{formatCents(listing.suggestedPriceCents)}</strong>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Listing details</p>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500 bg-white"
          >
            <option value="">No category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <div>
          <span className="text-sm font-medium text-slate-700">Condition</span>
          <div className="flex gap-2 mt-1.5">
            {['New', 'Like New', 'Used'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(condition === c ? '' : c)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  condition === c
                    ? 'bg-maple-500 border-maple-500 text-white'
                    : 'border-slate-300 text-slate-600 hover:border-maple-300 hover:text-maple-600'
                }`}
              >{c}</button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500 resize-none"
          />
        </label>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pricing</p>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Your cost (CAD) <span className="text-slate-400 font-normal text-xs">private</span></span>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number" step="0.01" min="0"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Listing price (CAD)</span>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number" step="0.01" min="0"
                value={listed}
                onChange={(e) => setListed(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500"
              />
            </div>
          </label>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">Quick presets</p>
          <PricePresetButtons
            retailCents={listing.retailPriceCents}
            selectedCents={listedCents}
            onPick={(c) => setListed(c / 100)}
          />
        </div>

        {listedCents > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ProfitMarginBadge listedCents={listedCents} costCents={costCents} />
            {listing.retailPriceCents > listedCents && (
              <span className="text-sm text-slate-500">
                Buyers see <strong className="text-brand-700">{Math.round((1 - listedCents / listing.retailPriceCents) * 100)}% off</strong> retail
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex-1 bg-maple-500 text-white py-2.5 rounded-xl hover:bg-maple-600 font-semibold transition active:scale-[0.98] disabled:opacity-50 text-sm shadow-sm"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          {listing.status === 'DRAFT' && (
            <button
              onClick={() => { saveAll(); setStatus('LIVE'); }}
              className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl hover:bg-brand-700 font-semibold transition text-sm shadow-sm"
            >
              Publish
            </button>
          )}
          {listing.status === 'LIVE' && (
            <button
              onClick={() => setStatus('SOLD')}
              className="flex-1 bg-slate-700 text-white py-2.5 rounded-xl hover:bg-slate-800 font-semibold transition text-sm shadow-sm"
            >
              Mark as sold
            </button>
          )}
          <button
            onClick={() => setStatus('REMOVED')}
            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium transition text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
