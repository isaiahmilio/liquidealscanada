import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import type { OwnerListing } from '../../lib/types';
import { ImageDropzone } from '../../components/ImageDropzone';
import { PricePresetButtons } from '../../components/PricePresetButtons';
import { ProfitMarginBadge } from '../../components/ProfitMarginBadge';

type Condition = 'new' | 'like-new' | 'used' | '';

const CATEGORIES = ['Electronics', 'Home', 'Kitchen', 'Clothing', 'Beauty', 'Tools', 'Toys', 'Sports', 'Office', 'Other'];

export function ManualListing({ onBack }: { onBack: () => void }) {
  const nav = useNavigate();

  const [title, setTitle]             = useState('');
  const [photo, setPhoto]             = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [condition, setCondition]     = useState<Condition>('');
  const [quality, setQuality]         = useState(8);
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('');
  const [cost, setCost]               = useState('');
  const [retail, setRetail]           = useState('');
  const [listed, setListed]           = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const retailCents = Math.round((parseFloat(retail) || 0) * 100);
  const listedCents = Math.round((parseFloat(listed) || 0) * 100);
  const costCents   = Math.round((parseFloat(cost)   || 0) * 100);

  const canPublish = title.trim().length > 0 && listedCents > 0;

  function selectPhoto(file: File) {
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function conditionText() {
    if (condition === 'new') return 'New';
    if (condition === 'like-new') return `Like New — ${quality}/10`;
    if (condition === 'used') return `Used — ${quality}/10`;
    return '';
  }

  async function publish() {
    setError(null);
    setSaving(true);
    try {
      const condText = conditionText();
      const fullDescription = [condText ? `Condition: ${condText}` : '', description].filter(Boolean).join('\n\n');

      const fd = new FormData();
      fd.append('title', title.trim());
      if (fullDescription) fd.append('description', fullDescription);
      if (category)         fd.append('category', category);
      fd.append('costCents',        String(costCents));
      fd.append('retailPriceCents', String(retailCents));
      fd.append('listedPriceCents', String(listedCents));
      if (photo) fd.append('image', photo);

      const res = await api.post<{ listing: OwnerListing }>('/api/seller/listings/manual', fd);
      await api.patch(`/api/listings/${res.listing.id}`, { status: 'LIVE' });
      nav('/seller');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create listing');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">⚠️ {error}</p>
      )}

      {/* Photo + title */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Item info</p>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Product name <span className="text-red-500">*</span></span>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Sony WH-1000XM5 Headphones"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-slate-700">Photo <span className="text-slate-400 font-normal">(optional)</span></span>
          <div className="mt-1.5">
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="preview" className="w-full max-h-52 object-contain rounded-xl border border-slate-200 bg-slate-50" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-white border border-slate-300 text-slate-600 rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-slate-50 shadow-sm"
                >✕</button>
              </div>
            ) : (
              <ImageDropzone onFileSelected={selectPhoto} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500 bg-white"
            >
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Your cost (CAD) <span className="text-slate-400 font-normal text-xs">private</span></span>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number" step="0.01" min="0" placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500"
              />
            </div>
          </label>
        </div>

        {/* Condition */}
        <div>
          <span className="text-sm font-medium text-slate-700">Condition</span>
          <div className="flex gap-2 mt-1.5">
            {(['new', 'like-new', 'used'] as Condition[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(condition === c ? '' : c)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  condition === c
                    ? 'bg-maple-500 border-maple-500 text-white'
                    : 'border-slate-300 text-slate-600 hover:border-maple-300 hover:text-maple-600'
                }`}
              >
                {c === 'new' ? 'New' : c === 'like-new' ? 'Like New' : 'Used'}
              </button>
            ))}
          </div>
          {(condition === 'like-new' || condition === 'used') && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Quality: <strong>{quality}/10</strong>
                <span className="ml-1 text-slate-400">
                  {quality >= 9 ? '— practically perfect' : quality >= 7 ? '— minor signs of use' : quality >= 5 ? '— noticeable wear' : '— heavy wear'}
                </span>
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuality(n)}
                    className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
                      quality === n ? 'bg-maple-500 border-maple-500 text-white' : 'border-slate-300 text-slate-700 hover:border-maple-300'
                    }`}
                  >{n}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></span>
          <textarea
            rows={3}
            placeholder="Included accessories, any defects, storage, colour…"
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
            <span className="text-sm font-medium text-slate-700">Retail price (CAD)</span>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number" step="0.01" min="0" placeholder="0.00"
                value={retail}
                onChange={(e) => setRetail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">What it sells for at Walmart, Best Buy, etc.</p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Your listing price (CAD) <span className="text-red-500">*</span></span>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number" step="0.01" min="0" placeholder="0.00"
                value={listed}
                onChange={(e) => setListed(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maple-500"
              />
            </div>
          </label>
        </div>

        {retailCents > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Quick price presets</p>
            <PricePresetButtons
              retailCents={retailCents}
              onPick={(c) => setListed(String(c / 100))}
            />
          </div>
        )}

        {listedCents > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ProfitMarginBadge listedCents={listedCents} costCents={costCents} />
            {retailCents > listedCents && (
              <span className="text-sm text-slate-500">
                Buyers see <strong className="text-brand-700">{Math.round((1 - listedCents / retailCents) * 100)}% off</strong> retail
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
        >← Back</button>
        <button
          onClick={publish}
          disabled={!canPublish || saving}
          className="flex-1 bg-maple-500 text-white py-3 rounded-xl hover:bg-maple-600 font-semibold transition active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          {saving ? 'Publishing…' : '🚀 Publish listing'}
        </button>
      </div>
    </div>
  );
}
