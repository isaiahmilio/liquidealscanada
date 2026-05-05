import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import type { OwnerListing } from '../../lib/types';
import { ImageDropzone } from '../../components/ImageDropzone';
import { PricePresetButtons } from '../../components/PricePresetButtons';
import { ProfitMarginBadge } from '../../components/ProfitMarginBadge';
import { formatCents, savingsPercent } from '../../lib/pricing';
import { ManualListing } from './ManualListing';

type Mode = 'choose' | 'auto' | 'manual';
type Step = 'photo' | 'price' | 'publish';

interface CreateResponse {
  listing: OwnerListing;
  ai: { confidence: number; source: 'serpapi' | 'static' | 'none' };
}

export function NewListing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [mode, setMode]   = useState<Mode>('choose');
  const [step, setStep]   = useState<Step>('photo');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<OwnerListing | null>(null);
  const [aiSource, setAiSource] = useState<'serpapi' | 'static' | 'none'>('none');
  const [productHint, setProductHint] = useState('');

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user)   return <Navigate to="/login" replace />;

  if (mode === 'manual') {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">List a new item</h1>
        <ManualListing onBack={() => setMode('choose')} />
      </div>
    );
  }

  if (mode === 'choose') {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">List a new item</h1>
        <p className="text-slate-500 mb-8">How would you like to create your listing?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('auto')}
            className="text-left p-6 rounded-xl border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-colors"
          >
            <div className="text-2xl mb-3">AI</div>
            <h2 className="font-semibold text-slate-900 mb-1">Automatic</h2>
            <p className="text-sm text-slate-500">Upload a photo and AI identifies the product, looks up the retail price, and suggests a selling price.</p>
          </button>
          <button
            onClick={() => setMode('manual')}
            className="text-left p-6 rounded-xl border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-colors"
          >
            <div className="text-2xl mb-3">✏️</div>
            <h2 className="font-semibold text-slate-900 mb-1">Manual</h2>
            <p className="text-sm text-slate-500">Enter the product name, details, your cost, and retail price step by step. Full control over every field.</p>
          </button>
        </div>
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
      setListing(res.listing);
      setAiSource(res.ai.source);
      setStep('price');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function patchListing(patch: Partial<OwnerListing>) {
    if (!listing) return;
    try {
      const res = await api.patch<{ listing: OwnerListing }>(`/api/listings/${listing.id}`, patch);
      setListing(res.listing);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function publish() {
    if (!listing) return;
    try {
      await api.patch(`/api/listings/${listing.id}`, { status: 'LIVE' });
      nav('/seller');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Publish failed');
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">List a new item</h1>
      <Steps current={step} />

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {step === 'photo' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">
              Product name <span className="text-slate-400">(optional — helps AI be more accurate)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Meta Quest 3S 128GB"
              value={productHint}
              onChange={(e) => setProductHint(e.target.value)}
              disabled={analyzing}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            />
          </div>
          <ImageDropzone onFileSelected={uploadPhoto} disabled={analyzing} />
          {analyzing && (
            <div className="mt-6 text-center text-slate-500">
              <p className="font-medium">Analyzing your photo…</p>
              <p className="text-sm">Identifying the product and checking Canadian retailer prices.</p>
            </div>
          )}
        </div>
      )}

      {step === 'price' && listing && (
        <PriceStep
          listing={listing}
          aiSource={aiSource}
          onChange={patchListing}
          onNext={() => setStep('publish')}
        />
      )}

      {step === 'publish' && listing && (
        <PublishStep
          listing={listing}
          onChange={patchListing}
          onPublish={publish}
          onBack={() => setStep('price')}
        />
      )}
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'photo',   label: '1. Photo' },
    { key: 'price',   label: '2. Price' },
    { key: 'publish', label: '3. Publish' },
  ];
  const order: Step[] = ['photo', 'price', 'publish'];
  const idx = order.indexOf(current);
  return (
    <ol className="flex gap-3 mb-8 text-sm">
      {steps.map((s, i) => (
        <li
          key={s.key}
          className={`px-3 py-1 rounded-full ${
            i === idx ? 'bg-brand-600 text-white' :
            i < idx   ? 'bg-brand-50 text-brand-700' :
                        'bg-slate-100 text-slate-500'
          }`}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}

function PriceStep({
  listing, aiSource, onChange, onNext,
}: {
  listing: OwnerListing;
  aiSource: 'serpapi' | 'static' | 'none';
  onChange: (patch: Partial<OwnerListing>) => void;
  onNext: () => void;
}) {
  const [cost, setCost]     = useState(listing.costCents / 100);
  const [listed, setListed] = useState(listing.listedPriceCents / 100);
  const listedCents = Math.round(listed * 100);
  const costCents   = Math.round(cost * 100);
  const savings = savingsPercent(listing.retailPriceCents, listedCents);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 bg-white rounded-lg border border-slate-200 p-4">
        <img src={listing.photoUrl ?? undefined} alt="" className="w-32 h-32 object-cover rounded" />
        <div className="flex-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">AI identified</p>
          <h2 className="text-lg font-medium">{listing.identifiedProduct ?? 'Unknown item'}</h2>
          {listing.category && <p className="text-sm text-slate-500">Category: {listing.category}</p>}
          <p className="mt-3 text-sm">
            Retail price: <strong>{formatCents(listing.retailPriceCents)}</strong>{' '}
            <span className="text-xs text-slate-400">
              ({aiSource === 'serpapi' ? 'live' : aiSource === 'static' ? 'reference' : 'no data'})
            </span>
          </p>
          {listing.priceSources.length > 0 && (
            <ul className="mt-2 text-xs text-slate-500 space-y-0.5">
              {listing.priceSources.slice(0, 4).map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-600">
                      {s.retailer}
                    </a>
                  ) : (
                    s.retailer
                  )}
                  {' '}— {formatCents(s.priceCents)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
        <div>
          <label className="block">
            <span className="text-sm text-slate-600">Your cost (CAD)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
              onBlur={() => onChange({ costCents })}
              className="mt-1 block w-full rounded-md border-slate-300 border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <p className="text-xs text-slate-400 mt-1">Only you can see this. Used to calculate your profit margin.</p>
        </div>

        <div>
          <label className="block">
            <span className="text-sm text-slate-600">Your listing price (CAD)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={listed}
              onChange={(e) => setListed(parseFloat(e.target.value) || 0)}
              onBlur={() => onChange({ listedPriceCents: listedCents })}
              className="mt-1 block w-full rounded-md border-slate-300 border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <div className="mt-3">
            <PricePresetButtons
              retailCents={listing.retailPriceCents}
              onPick={(c) => { setListed(c / 100); onChange({ listedPriceCents: c }); }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <ProfitMarginBadge listedCents={listedCents} costCents={costCents} />
          <span className="text-sm text-slate-500">
            Buyers will see {savings > 0 ? `${savings}% savings` : 'no discount'}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700"
        >
          Next: details &rarr;
        </button>
      </div>
    </div>
  );
}

function PublishStep({
  listing, onChange, onPublish, onBack,
}: {
  listing: OwnerListing;
  onChange: (patch: Partial<OwnerListing>) => void;
  onPublish: () => void;
  onBack: () => void;
}) {
  const [title, setTitle]             = useState(listing.title);
  const [description, setDescription] = useState(listing.description ?? '');
  const [category, setCategory]       = useState(listing.category ?? '');

  return (
    <div className="space-y-4 bg-white rounded-lg border border-slate-200 p-4">
      <label className="block">
        <span className="text-sm text-slate-600">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onChange({ title })}
          className="mt-1 block w-full rounded-md border-slate-300 border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </label>

      <label className="block">
        <span className="text-sm text-slate-600">Description</span>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => onChange({ description })}
          className="mt-1 block w-full rounded-md border-slate-300 border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </label>

      <label className="block">
        <span className="text-sm text-slate-600">Category</span>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onBlur={() => onChange({ category })}
          className="mt-1 block w-full rounded-md border-slate-300 border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </label>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50"
        >
          &larr; Back
        </button>
        <button
          onClick={onPublish}
          className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700"
        >
          Publish listing
        </button>
      </div>
    </div>
  );
}
