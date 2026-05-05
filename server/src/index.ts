import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { listingsRouter, sellerListingsRouter } from './routes/listings.js';
import { aiRouter } from './routes/ai.js';
import { pricingRouter } from './routes/pricing.js';
import { attachUser } from './middleware/requireAuth.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads');

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(attachUser);

// Serve uploaded images statically. Path matches storage.publicUrl().
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Cost guardrail: limit listing creations + AI calls to 20/hour per IP.
// Prevents a runaway client from burning the OpenAI/SerpAPI budget.
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
});
