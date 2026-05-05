import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import type { OwnerListing } from '../../lib/types';
import { ImageDropzone } from '../../components/ImageDropzone';
import { PricePresetButtons } from '../../components/PricePresetButtons';
import { ProfitMarginBadge } from '../../components/ProfitMarginBadge';
import { formatCents } from '../../lib/pricing';

type Step = 1 | 2 | 3 | 4 | 5;
type ConditionType = 'new' | 'like-new' | 'used' | '';

const CATEGORIES = ['Electronics', 'Home', 'Kitchen', 'Clothing', 'Beauty', 'Tools', 'Toys', 'Sports', 'Office', 'Other'];

const STEP_LABELS: Record<Step, string> = {
  1: 'Product name & photo',
  2: 'Product details',
  3: 'Your cost',
  4: 'Retail price',
  5: 'Listing price',
};

export function ManualListing({ onBack }: { onBack: () => void }) {
  const nav = useNavigate();

  const [step, setStep]               = useState<Step>(1);
  const [title, setTitle]             = useState('');
  const [photo, setPhoto]             = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [conditionType, setConditionType] = useState<ConditionType>('');
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

  function selectPhoto(file: File) {
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function conditionLabel(): string {
    if (conditionType === 'new') return 'New';
    if (conditionType === 'like-new') return `Like New — ${quality}/10`;
    if (conditionType === 'used') return `Used — ${quality}/10`;
    return '';
  }

  function next() { setStep((s) => Math.min(5, s + 1) as Step); }
  function back() {
    if (step === 1) { onBack(); return; }
    setStep((s) => Math.max(1, s - 1) as Step);
  }

  async function publish() {
    setError(null);
    setSaving(true);
    try {
      const condText = conditionLabel();
      const fullDescription = [condText ? `Condition: ${condText}` : '', description].filter(Boolean).join('\n\n');

      const fd = new FormData();
      fd.append('title', title);
      if (fullDescription) fd.append('description', fullDescription);
      if (category)         fd.append('category', category);
      fd.append('costCents',         String(costCents));
      fd.append('retailPriceCents',  String(retailCents));
      fd.append('listedPriceCents',  String(listedCents));
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
    <div className="max-w-xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {([1, 2, 3, 4, 5] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                ${s === step ? 'bg-brand-600 text-white' : s < step ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>
                {s}
              </div>
              {s < 5 && <div className={`h-0.5 w-10 sm:w-16 ${s < step ? 'bg-brand-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">Step {step} of 5 — <span className="font-medium text-slate-700">{STEP_LABELS[step]}</span></p>
      </div>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      {/* Step 1 — Product name & photo */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Meta Quest 3S 128GB"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-400 mt-1">Be specific — include brand, model, and key specs.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product photo <span className="text-red-500">*</span>
            </label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="preview" className="w-full max-h-64 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-white border border-slate-300 text-slate-600 rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-slate-50"
                >
                  ✕
                </button>
              </div>
            ) : (
              <ImageDropzone onFileSelected={selectPhoto} />
            )}
          </div>

          <StepNav onBack={back} onNext={next} nextDisabled={!title.trim() || !photo} />
        </div>
      )}

      {/* Step 2 — Product details */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Condition</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {(['new', 'like-new', 'used'] as ConditionType[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConditionType(c)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                    conditionType === c
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-slate-300 text-slate-700 hover:border-brand-400 hover:bg-brand-50'
                  }`}
                >
                  {c === 'new' ? 'New' : c === 'like-new' ? 'Like New' : 'Used'}
                </button>
              ))}
            </div>

            {(conditionType === 'like-new' || conditionType === 'used') && (
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  Quality rating: <strong>{quality}/10</strong>
                  <span className="text-slate-400 ml-2 text-xs">
                    {quality >= 9 ? '— practically perfect' : quality >= 7 ? '— minor signs of use' : quality >= 5 ? '— noticeable wear' : '— heavy wear'}
                  </span>
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuality(n)}
                      className={`w-9 h-9 rounded-md border text-sm font-medium transition-colors ${
                        quality === n
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-slate-300 text-slate-700 hover:border-brand-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Included accessories, any defects, storage, colour…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <StepNav onBack={back} onNext={next} />
        </div>
      )}

      {/* Step 3 — Cost */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">What did you pay for this item? (CAD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                autoFocus
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Only you can see this — used to calculate your profit margin.</p>
          </div>
          <StepNav onBack={back} onNext={next} />
        </div>
      )}

      {/* Step 4 — Retail price */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Retail price at stores like Walmart, Best Buy (CAD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                autoFocus
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={retail}
                onChange={(e) => setRetail(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Shown to buyers so they can see the savings.</p>
          </div>
          <StepNav onBack={back} onNext={next} nextDisabled={retailCents <= 0} />
        </div>
      )}

      {/* Step 5 — Listing price */}
      {step === 5 && (
        <div className="space-y-5">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-sm text-slate-600 space-y-1">
            <p>Retail price: <strong>{formatCents(retailCents)}</strong></p>
            {costCents > 0 && <p>Your cost: <strong>{formatCents(costCents)}</strong></p>}
            {conditionType && <p>Condition: <strong>{conditionLabel()}</strong></p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quick presets</label>
            <PricePresetButtons
              retailCents={retailCents}
              onPick={(c) => setListed(String(c / 100))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your listing price (CAD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={listed}
                onChange={(e) => setListed(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {listedCents > 0 && (
            <ProfitMarginBadge listedCents={listedCents} costCents={costCents} />
          )}

          <div className="flex justify-between pt-2">
            <button onClick={back} className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50">
              &larr; Back
            </button>
            <button
              onClick={publish}
              disabled={listedCents <= 0 || saving}
              className="bg-brand-600 text-white px-5 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Publishing…' : 'Publish listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepNav({ onBack, onNext, nextDisabled = false }: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex justify-between pt-2">
      <button onClick={onBack} className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50">
        &larr; Back
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="bg-brand-600 text-white px-5 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50"
      >
        Next &rarr;
      </button>
    </div>
  );
}
