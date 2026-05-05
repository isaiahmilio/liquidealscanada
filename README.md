<div align="center">

# LiquiDealsCanada

**A modern liquidation marketplace built for Canada.**  
Sellers snap a photo — AI identifies the product, fetches live Canadian retail prices, and suggests a sale price. Buyers browse deep discounts with transparent savings.

![Node](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## Features

- **AI-powered listing creation** — upload a photo and GPT-4o identifies the product automatically
- **Live Canadian pricing** — SerpAPI pulls prices from amazon.ca, bestbuy.ca, walmart.ca, and more
- **Profit margin dashboard** — sellers see cost, listed price, and margin in real time
- **Buyer browse page** — grid of live deals with savings % badges and category filters
- **Soft-delete with undo** — 5-second removal buffer prevents accidental listing deletions
- **Privacy-aware API** — cost and margin data are never exposed to non-owners

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, React Router, TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | Prisma ORM — SQLite (dev) / PostgreSQL (prod) |
| AI | OpenAI Vision (`gpt-4o`) |
| Pricing | SerpAPI (Google Shopping) + static Canadian retailer fallback |
| Auth | Session-based (express-session + bcrypt) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com) *(optional — for AI image identification)*
- A [SerpAPI key](https://serpapi.com) *(optional — for live pricing; static fallback works without it)*

### Installation

```sh
# 1. Install dependencies
npm install

# 2. Configure environment
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
SESSION_SECRET=your_random_secret   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
OPENAI_API_KEY=sk-...               # optional
SERPAPI_KEY=...                     # optional
```

```sh
# 3. Run database migrations
npm run prisma:migrate

# 4. Seed demo data (7 listings across Electronics, Kitchen, Gaming, Home, Clothing)
npm run db:seed

# 5. Start development servers
npm run dev
```

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:4000 |

**Demo account:** `demo@liquidealscanada.test` / `demopass123`

---

## How It Works

### Seller listing flow

```
/seller/new
  │
  ├── 1. Photo upload
  │       └── GPT-4o identifies product → SerpAPI fetches Canadian retail prices
  │
  ├── 2. Pricing
  │       └── Suggested price (60% of retail) · seller enters cost · margin badge updates live
  │
  └── 3. Publish
          └── Add title / description / category → status becomes LIVE
```

### Pricing formulas

```ts
savingsPercent      = (retail - listed) / retail
profitMarginPercent = (listed - cost)   / listed   // stripped from non-owner API responses
suggestedPrice      = Math.round(retail * 0.60)
```

---

## Project Structure

```
liquidealscanada/
├── client/                   # React SPA (Vite + Tailwind)
│   └── src/
│       ├── routes/           # Page components (Browse, Dashboard, ListingDetail, …)
│       ├── components/       # ListingCard, ImageDropzone, ProfitMarginBadge, …
│       └── lib/              # API wrapper, auth context, pricing utils, types
│
└── server/                   # Express REST API
    ├── prisma/               # Schema, migrations, seed
    └── src/
        ├── routes/           # auth, listings, ai, pricing
        ├── services/         # openaiVision, serpApi, pricing, aiPipeline, storage, auth
        ├── middleware/       # requireAuth, requireSeller
        ├── lib/              # Prisma client, Zod validators, pricing math
        └── data/             # canadian-retailers.json (static price fallback)
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/listings` | Browse live listings (paginated) |
| `GET` | `/api/listings/:id` | Listing detail (cost stripped for non-owners) |
| `POST` | `/api/listings` | Create listing (seller only) |
| `PATCH` | `/api/listings/:id` | Update listing (owner only) |
| `DELETE` | `/api/listings/:id` | Soft-delete listing (owner only) |
| `POST` | `/api/ai/analyze-image` | AI product identification |
| `GET` | `/api/health` | Health check |

---

## Rate Limiting

`POST /api/listings` and `POST /api/ai/analyze-image` are limited to **20 requests / hour per IP** via `express-rate-limit`. Both OpenAI and SerpAPI degrade gracefully — if unconfigured or unavailable, listings are still created with manual entry and static fallback prices.

---

## Production Notes

- **Database:** swap SQLite for PostgreSQL by changing `provider` in `server/prisma/schema.prisma` and rerunning migrations
- **File storage:** `server/uploads/` is gitignored and used for local dev — replace with S3 or similar for production
- **Environment:** never commit `server/.env`; use your host's secret manager

---

## Roadmap

- [ ] Stripe Connect payments
- [ ] Buyer/seller in-app messaging
- [ ] Shipping label integration
- [ ] Reviews and seller ratings
- [ ] Live scraper to keep `canadian-retailers.json` up to date
