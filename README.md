# LiquiDealsCanada

A modern liquidation marketplace for Canada. Buyers browse discounted goods with prominent savings %; sellers upload a photo and the platform automatically identifies the product, fetches average Canadian retailer prices, suggests a sale price, and shows them their profit margin.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + React Router + TanStack Query
- **Backend**: Node.js + Express + TypeScript + Prisma
- **DB**: SQLite (dev). To use PostgreSQL in prod, change `datasource db { provider = "..." }` in `server/prisma/schema.prisma` and rerun migrations.
- **AI**: OpenAI Vision (`gpt-4o`) for image identification
- **Pricing**: SerpAPI (Google Shopping, Canadian retailers) with a static JSON fallback in `server/src/data/canadian-retailers.json`

## Setup

```sh
# 1. Install all workspace deps
npm install

# 2. Configure environment
cp server/.env.example server/.env
# then edit server/.env:
#   - SESSION_SECRET: any random string (e.g., `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
#   - OPENAI_API_KEY: from https://platform.openai.com (only needed for AI image ID)
#   - SERPAPI_KEY:     from https://serpapi.com (only needed for live pricing; static fallback works without it)

# 3. Create the dev database
npm run prisma:migrate

# 4. Seed a demo user + 2 listings (skip to start with an empty store)
npm run db:seed

# 5. Run both client and server
npm run dev
```

- **API**: http://localhost:4000
- **Web**: http://localhost:5173

The seed creates a demo account: `demo@liquidealscanada.test` / `demopass123`.

## How it works

### Seller upload flow (`/seller/new`)

1. **Photo step** — drop a photo. The server saves it, runs OpenAI Vision to identify the product, then queries SerpAPI for Canadian retailer prices (fallback: static JSON).
2. **Price step** — shows identified product, retail average with sources, and a suggested price (60% of retail). Seller enters their cost and chooses a listed price (manual entry or 50%/30% preset). A profit margin badge updates live.
3. **Publish step** — title/description/category, then publish. Status becomes `LIVE`.

### Pricing math

```ts
savingsPercent      = (retail - listed) / retail
profitMarginPercent = (listed - cost) / listed   // never returned to non-owners
suggestedPrice      = round(retail * 0.60)
```

Defined in both `client/src/lib/pricing.ts` and `server/src/lib/pricing.ts` — keep in sync.

### Privacy

`server/src/routes/listings.ts` `serializeListing()` strips `costCents` and `suggestedPriceCents` for non-owners. The buyer-facing `GET /api/listings/:id` will never include those fields unless the caller's session belongs to the seller.

## Layout

```
client/      React SPA (Vite, Tailwind)
  src/
    routes/        page components
    components/    ListingCard, ImageDropzone, PricePresetButtons, ProfitMarginBadge
    lib/           api wrapper, auth context, pricing math, types

server/      Express API
  prisma/          schema, migrations, seed
  src/
    routes/        auth, listings, ai, pricing
    services/      openaiVision, serpApi, pricing (combiner), aiPipeline (orchestrator), storage, auth
    middleware/    requireAuth, requireSeller
    lib/           db (Prisma client), validators (zod), pricing (math)
    data/          canadian-retailers.json (static price fallback)
  uploads/         local image storage (gitignored)
```

## Cost guardrails

`POST /api/listings` and `POST /api/ai/analyze-image` are rate-limited to 20/hour per IP via `express-rate-limit`. The OpenAI and SerpAPI services degrade gracefully — if either is unavailable or unconfigured, the listing still gets created with whatever data is available (zero retail price + manual entry, or static-fallback prices).

## Verification

After `npm run dev`:

- `curl http://localhost:4000/api/health` — returns `{ ok: true }`.
- Sign up / sign in flow: create an account, the session cookie persists.
- Upload a real product photo at `/seller/new` — confirm AI returns identified product within ~8s.
- Open an incognito window, browse `/`, click a listing — confirm `costCents` is **not** present in the JSON response.
- Browse `/` while logged in as the seller and click your own listing — confirm `costCents` and the margin badge **are** visible.

## Deferred to v2

Payments (Stripe Connect), buyer/seller messaging, shipping integration, reviews, and a real scraper that writes into `canadian-retailers.json`'s shape.
