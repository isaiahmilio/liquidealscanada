import { Router } from 'express';
import { z } from 'zod';
import { getRetailAverage } from '../services/pricing.js';

export const pricingRouter = Router();

const querySchema = z.object({ q: z.string().min(1).max(200) });

// GET /api/pricing/lookup?q=... — debug/admin helper to inspect retail averages.
pricingRouter.get('/lookup', async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'q is required' });
    const result = await getRetailAverage(parsed.data.q);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
