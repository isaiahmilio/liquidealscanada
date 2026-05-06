import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { publicUrl } from '../services/storage.js';

export const favoritesRouter = Router();

favoritesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const favs = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      favorites: favs.map((f) => ({
        id: f.id,
        listingId: f.listingId,
        createdAt: f.createdAt,
        listing: {
          id: f.listing.id,
          title: f.listing.title,
          status: f.listing.status,
          category: f.listing.category,
          photoUrl: f.listing.photoPath ? publicUrl(f.listing.photoPath) : null,
          listedPriceCents: f.listing.listedPriceCents,
          retailPriceCents: f.listing.retailPriceCents,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.post('/:listingId', requireAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: req.user!.id, listingId: req.params.listingId } },
      create: { userId: req.user!.id, listingId: req.params.listingId },
      update: {},
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.delete('/:listingId', requireAuth, async (req, res, next) => {
  try {
    await prisma.favorite.deleteMany({
      where: { userId: req.user!.id, listingId: req.params.listingId },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
