import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import type { OwnerListing } from '../../lib/types';
import { ImageDropzone } from '../../components/ImageDropzone';
import { PricePresetButtons } from '../../components/PricePresetButtons';
import { ProfitMarginBadge } from '../../components/ProfitMarginBadge';
import { formatCents } from '../../lib/pricing';
import { ManualListing } from './ManualListing';

type Mode = 'auto' | 'manual';
type Condition = 'New' | 'Like New' | 'Used' | '';

interface CreateResponse {
  listing: OwnerListing;
  ai: { confidence: number; source: 'serpapi' | 'static' | 'none' };
}

const CATEGORIES = ['Electronics', 'Home', 'Kitchen', 'Clothing', 'Beauty', 'Tools', 'Toys', 'Sports', 'Office', 'Other'];

export function NewListing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [mode, setMode]         = useState<Mode>('manual');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [listing, setListing]   = useState<OwnerListing | null>(null);
  const [aiSource, setAiSource] = useState<'serpapi' | 'static' | 'none'>('none');
  const [productHint, setProductHint] = useState('');

  // Editable review fields (shown after AI)
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('');
  const [cost, setCost]               = useState(0);
  const [listed, setListed]           = useState(0);
  const [condition, setCondition]     = useState<Condition>('');
  const [publishing, setPublishing]   = useState(false);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user)   return <Navigate to="/login" replace />;

  if (mode === 'manual') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">New listing</h1>
          <button
            onClick={() => setMode('auto')}
            className="text-sm text-slate-400 hover:text-maple-500 font-medium transition-colors"
          >
            Switch to AI auto-fill →
          </button>
        </div>
        <ManualListing onBack={() => nav('/seller')} />
      </div>
    );
  }

  async function uploadPhoto(file: File) {
    setError(null);
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (productHint.trim()) fd.append('productHint', productHint.trim());
      const res = await api.post<CreateResponse>('/api/listings', fd);
      const l = res.listing;
      setListing(l);
      setAiSource(res.ai.source);
      setTitle(l.title);
      setDescription(l.description ?? '');
      setCategory(l.category ?? '');
      setCost(l.costCents / 100);
      setListed(l.listedPriceCents / 100);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function publish() {
    if (!listing) return;
    setPublishing(true);
    setError(null);
    try {
      await api.patch(`/api/listings/${listing.id}`, {
        title,
        description,
        category,
        condition: condition || undefined,
        costCents:        Math.round(cost * 100),
        listedPriceCents: Math.round(listed * 100),
        status:           'LIVE',
      });
      nav('/seller');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Publish failed');
      setPublishing(false);
    }
  }

  const listedCents = Math.round(listed * 100);
  const costCents   = Math.round(cost * 100);

  // Upload step
  if (!listing) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">New listing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Upload a photo and AI will handle the rest</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Product name <span className="text-slate-400 font-normal">(optional — helps AI be more accurate)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Meta Quest 3S 128GB"
              value={productHint}
              onChange={(e) => setProductHint(e.target.value)}
              disabled={analyzing}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500 disabled:opacity-50"
            />
          </div>

          <ImageDropzone onFileSelected={uploadPhoto} disabled={analyzing} />

          {analyzing && (
            <div className="text-center py-4 text-slate-500">
              <div className="text-2xl mb-2 animate-pulse">🤖</div>
              <p className="font-medium text-sm">Analyzing your photo…</p>
              <p className="text-xs text-slate-400 mt-0.5">Identifying product and checking Canadian retailer prices</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">⚠️ {error}</p>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-5">
          Prefer to enter details yourself?{' '}
          <button onClick={() => setMode('manual')} className="text-maple-500 hover:underline font-medium">
            ← Back to manual entry
          </button>
        </p>
      </div>
    );
  }

  // Review + publish step (after AI)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Review & publish</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {aiSource === 'serpapi' ? '✅ Live retail prices fetched' : aiSource === 'static' ? '📋 Reference prices used' : '📝 Review AI suggestions'}
          </p>
        </div>
        <Link to="/seller" className="text-sm text-slate-400 hover:text-slate-700">Cancel</Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">⚠️ {error}</p>
      )}

      <div className="space-y-4">
        {/* Photo + retail info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 shadow-sm">
          <img src={listing.photoUrl ?? undefined} alt="" className="w-24 h-24 object-cover rounded-xl flex-shrink-0 bg-slate-100" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">AI identified</p>
            <p className="font-semibold text-slate-900 truncate">{listing.identifiedProduct ?? 'Unknown product'}</p>
            <p className="text-sm text-slate-500 mt-0.5">Retail avg: <strong>{formatCents(listing.retailPriceCents)}</strong></p>
            {listing.priceSources.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {listing.priceSources.slice(0, 3).map((s, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {s.retailer} · {formatCents(s.priceCents)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editable details */}
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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div>
            <span className="text-sm font-medium text-slate-700">Condition</span>
            <div className="flex gap-2 mt-1.5">
              {(['New', 'Like New', 'Used'] as Condition[]).map((c) => (
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
            <span className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Included accessories, any defects…"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500 resize-none"
            />
          </label>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your listing price</p>

          <PricePresetButtons
            retailCents={listing.retailPriceCents}
            onPick={(c) => setListed(c / 100)}
          />

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number" step="0.01" min="0"
              value={listed}
              onChange={(e) => setListed(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-300 pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500"
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

        <button
          onClick={publish}
          disabled={!title.trim() || listedCents <= 0 || publishing}
          className="w-full bg-maple-500 text-white py-3 rounded-xl hover:bg-maple-600 font-semibold transition active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          {publishing ? 'Publishing…' : '🚀 Publish listing'}
        </button>
      </div>
    </div>
  );
}
