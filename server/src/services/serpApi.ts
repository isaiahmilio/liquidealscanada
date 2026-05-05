import { getJson } from 'serpapi';

// Queries SerpAPI's Google Shopping engine, restricted to Canadian retailers we care about.

export interface RetailPrice {
  retailer: string;
  priceCents: number;
  url: string | null;
}

const ALLOWED_RETAILERS = [
  'walmart.ca',
  'amazon.ca',
  'bestbuy.ca',
  'canadiantire.ca',
  'homedepot.ca',
  'staples.ca',
  'thebay.com',
];

// Each entry: if the SerpAPI source name contains the key, map to that retailer.
const SOURCE_NAME_MAP: [string, string][] = [
  ['walmart',        'walmart.ca'],
  ['amazon',         'amazon.ca'],
  ['best buy',       'bestbuy.ca'],
  ['canadian tire',  'canadiantire.ca'],
  ['home depot',     'homedepot.ca'],
  ['staples',        'staples.ca'],
  ['the bay',        'thebay.com'],
  ["hudson's bay",   'thebay.com'],
];

function parseCents(raw: string): number | null {
  const m = raw.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]!.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function resolveRetailer(url: string | undefined, source: string | undefined): string | null {
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      const byUrl = ALLOWED_RETAILERS.find((r) => host === r || host.endsWith(`.${r}`));
      if (byUrl) return byUrl;
    } catch { /* ignore malformed URLs */ }
  }
  if (source) {
    const s = source.toLowerCase();
    const match = SOURCE_NAME_MAP.find(([key]) => s.includes(key));
    return match?.[1] ?? null;
  }
  return null;
}

export async function searchCanadianRetailers(query: string): Promise<RetailPrice[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey || apiKey.startsWith('...')) return [];

  try {
    const results = await getJson({
      engine: 'google_shopping',
      q: query,
      gl: 'ca',
      hl: 'en',
      location: 'Canada',
      api_key: apiKey,
    });

    const items: { title?: string; price?: string; extracted_price?: number; product_link?: string; link?: string; source?: string }[] =
      (results as { shopping_results?: unknown[] }).shopping_results as never ?? [];

    const prices: RetailPrice[] = [];
    for (const it of items) {
      const retailer = resolveRetailer(it.link, it.source);
      if (!retailer) continue;
      const cents = it.extracted_price
        ? Math.round(it.extracted_price * 100)
        : (it.price ? parseCents(it.price) : null);
      if (!cents) continue;
      prices.push({ retailer, priceCents: cents, url: it.product_link ?? null });
      if (prices.length >= 6) break;
    }
    return prices;
  } catch (err) {
    console.error('[serpApi] query failed:', err instanceof Error ? err.message : err);
    return [];
  }
}
