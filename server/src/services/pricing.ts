import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchCanadianRetailers, type RetailPrice } from './serpApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FALLBACK_PATH = path.resolve(__dirname, '../data/canadian-retailers.json');

interface FallbackProduct {
  keywords: string[];
  prices: RetailPrice[];
}
interface FallbackFile {
  products: FallbackProduct[];
  default: { prices: RetailPrice[] };
}

async function loadFallback(): Promise<FallbackFile> {
  const raw = await fs.readFile(FALLBACK_PATH, 'utf8');
  return JSON.parse(raw) as FallbackFile;
}

// Priority order for picking the "retail price" — first match wins.
const RETAILER_PRIORITY = [
  'walmart.ca',
  'bestbuy.ca',
  'amazon.ca',
  'canadiantire.ca',
  'homedepot.ca',
  'staples.ca',
  'thebay.com',
];

const RETAILER_SEARCH_URLS: Record<string, (q: string) => string> = {
  'walmart.ca':      (q) => `https://www.walmart.ca/search?q=${encodeURIComponent(q)}`,
  'amazon.ca':       (q) => `https://www.amazon.ca/s?k=${encodeURIComponent(q)}`,
  'bestbuy.ca':      (q) => `https://www.bestbuy.ca/en-ca/search?query=${encodeURIComponent(q)}`,
  'canadiantire.ca': (q) => `https://www.canadiantire.ca/en/search#q=${encodeURIComponent(q)}`,
  'homedepot.ca':    (q) => `https://www.homedepot.ca/search#q=${encodeURIComponent(q)}`,
  'staples.ca':      (q) => `https://www.staples.ca/search?query=${encodeURIComponent(q)}`,
  'thebay.com':      (q) => `https://www.thebay.com/search?q=${encodeURIComponent(q)}`,
};

function withSearchUrls(prices: RetailPrice[], query: string): RetailPrice[] {
  return prices.map((p) => ({
    ...p,
    url: p.url ?? (RETAILER_SEARCH_URLS[p.retailer]?.(query) ?? null),
  }));
}

function lookupFallback(file: FallbackFile, query: string): RetailPrice[] {
  const q = query.toLowerCase();
  for (const p of file.products) {
    if (p.keywords.some((kw) => q.includes(kw.toLowerCase()))) return p.prices;
  }
  return file.default.prices;
}

// Drop prices more than 2.5x the median (bundles, wrong variants, etc.)
function filterOutliers(prices: RetailPrice[]): RetailPrice[] {
  if (prices.length < 2) return prices;
  const sorted = [...prices].sort((a, b) => a.priceCents - b.priceCents);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0
    ? sorted[mid]!.priceCents
    : (sorted[mid - 1]!.priceCents + sorted[mid]!.priceCents) / 2;
  const filtered = prices.filter((p) => p.priceCents >= median * 0.5 && p.priceCents <= median * 1.5);
  return filtered.length >= 1 ? filtered : prices;
}

// Pick the price from the highest-priority retailer found.
function pickPrimaryPrice(prices: RetailPrice[]): number {
  for (const retailer of RETAILER_PRIORITY) {
    const match = prices.find((p) => p.retailer === retailer);
    if (match) return match.priceCents;
  }
  return prices[0]!.priceCents;
}

export interface RetailAverageResult {
  retailPriceCents: number;
  priceSources: RetailPrice[];
  source: 'serpapi' | 'static';
}

export async function getRetailAverage(query: string): Promise<RetailAverageResult> {
  const live = await searchCanadianRetailers(query);
  if (live.length >= 1) {
    const cleaned = withSearchUrls(filterOutliers(live), query);
    return {
      retailPriceCents: pickPrimaryPrice(cleaned),
      priceSources: cleaned,
      source: 'serpapi',
    };
  }

  const file = await loadFallback();
  const fallback = withSearchUrls(lookupFallback(file, query), query);
  return {
    retailPriceCents: pickPrimaryPrice(fallback),
    priceSources: fallback,
    source: 'static',
  };
}
