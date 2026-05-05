import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireSeller } from '../middleware/requireSeller.js';
import { analyzeListingFromImage } from '../services/aiPipeline.js';

export const aiRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/ai/analyze-image — re-run AI without creating a listing.
// Useful when a seller wants to preview AI output before uploading.
aiRouter.post('/analyze-image', requireAuth, requireSeller, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image file required (field name: image)' });
    const result = await analyzeListingFromImage(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
