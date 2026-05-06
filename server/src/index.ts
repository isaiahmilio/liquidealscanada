import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
import { authRouter } from './routes/auth.js';
import { listingsRouter, sellerListingsRouter } from './routes/listings.js';
import { aiRouter } from './routes/ai.js';
import { pricingRouter } from './routes/pricing.js';
import { attachUser } from './middleware/requireAuth.js';
import { runSeed } from './lib/seed.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const IS_PROD = process.env.NODE_ENV === 'production';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads');

// In production the React app is served from this same server (same origin),
// so CORS is only needed in development.
app.use(cors({ origin: IS_PROD ? false : CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(attachUser);

app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded — try again later' },
});

app.use('/api/auth', authRouter);
app.use('/api/listings', aiLimiter, listingsRouter);
app.use('/api/seller', sellerListingsRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/pricing', pricingRouter);

// Serve the React SPA in production. Must come after all API routes.
if (IS_PROD) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (err.message?.includes('Only JPEG')) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] uploads served from ${UPLOAD_DIR}`);
  if (IS_PROD) console.log('[server] serving React build from client/dist');
  runSeed();
});
