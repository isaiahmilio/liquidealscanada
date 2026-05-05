import { identifyImage } from './openaiVision.js';
import { getRetailAverage } from './pricing.js';
import { suggestedFromRetail } from '../lib/pricing.js';
import type { RetailPrice } from './serpApi.js';

// Top-level AI pipeline used by POST /api/listings.
// Every failure mode degrades gracefully — never throws to the route.

export interface ListingAnalysis {
  identifiedProduct: string | null;
  category: string | null;
  confidence: number;
  retailPriceCents: number;
  suggestedPriceCents: number;
  priceSources: RetailPrice[];
  source: 'serpapi' | 'static' | 'none';
}

const EMPTY: ListingAnalysis = {
  identifiedProduct: null,
  category: null,
  confidence: 0,
  retailPriceCents: 0,
  suggestedPriceCents: 0,
  priceSources: [],
  source: 'none',
};

export async function analyzeListingFromImage(
  buffer: Buffer,
  mimeType: string,
  productHint?: string,
): Promise<ListingAnalysis> {
  const id = await identifyImage(buffer, mimeType, productHint);
  if (!id) return EMPTY;

  // Step 2: look up retail prices for the identified product.
  const pricing = await getRetailAverage(id.identifiedProduct);

  return {
    identifiedProduct: id.identifiedProduct,
    category: id.category,
    confidence: id.confidence,
    retailPriceCents:    pricing.retailPriceCents,
    suggestedPriceCents: suggestedFromRetail(pricing.retailPriceCents),
    priceSources:        pricing.priceSources,
    source:              pricing.source,
  };
}
