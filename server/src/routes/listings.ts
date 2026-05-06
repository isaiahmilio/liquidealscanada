import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/db.js';
import { listingUpdateSchema, listingQuerySchema } from '../lib/validators.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireSeller } from '../middleware/requireSeller.js';
import { putImage, publicUrl } from '../services/storage.js';
import { analyzeListingFromImage } from '../services/aiPipeline.js';

export const listingsRouter = Router();

// Shared multer instance — used by both auto and manual listing routes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|heic)$/i.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WEBP, or HEIC images are allowed'));
    }
    cb(null, true);
  },
});

const PAGE_SIZE = 24;

type ListingRow = Awaited<ReturnType<typeof prisma.listing.findUnique>>;

interface ListingWithSources {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  category: string | null;
  photoPath: string | null;
  retailPriceCents: number;
  suggestedPriceCents: number;
  listedPriceCents: number;
  costCents: number;
  identifiedProduct: string | null;
  condition: string | null;
  quantity: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  priceSources?: { retailer: string; priceCents: number; url: string | null }[];
  photos?: { id: string; photoPath: string; position: number }[];
}

function serializeListing(listing: ListingWithSources, viewerId: string | undefined) {
  const isOwner = viewerId && viewerId === listing.sellerId;

  // Build unified photos array: primary photo first, then extras ordered by position.
  const allPhotos: { id: string; url: string }[] = [];
  if (listing.photoPath) allPhotos.push({ id: 'primary', url: publicUrl(listing.photoPath) });
  const extras = (listing.photos ?? []).sort((a, b) => a.position - b.position);
  for (const p of extras) allPhotos.push({ id: p.id, url: publicUrl(p.photoPath) });

  const base = {
    id: listing.id,
    sellerId: listing.sellerId,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    photoUrl: listing.photoPath ? publicUrl(listing.photoPath) : null,
    photos: allPhotos,
    retailPriceCents: listing.retailPriceCents,
    listedPriceCents: listing.listedPriceCents,
    identifiedProduct: listing.identifiedProduct,
    condition: listing.condition,
    quantity: listing.quantity,
    status: listing.status,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    priceSources: listing.priceSources ?? [],
  };
  if (!isOwner) return base;
  return { ...base, suggestedPriceCents: listing.suggestedPriceCents, costCents: listing.costCents };
}

// POST /api/listings — multipart image upload. Creates DRAFT and runs AI pipeline.
listingsRouter.post('/', requireAuth, requireSeller, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image file required (field name: image)' });
    const sellerId = req.user!.id;

    const stored = await putImage(req.file.buffer, req.file.originalname, req.file.mimetype);

    const productHint = typeof req.body.productHint === 'string' && req.body.productHint.trim()
      ? req.body.productHint.trim()
      : undefined;

    const ai = await analyzeListingFromImage(req.file.buffer, req.file.mimetype, productHint);

    const listing = await prisma.listing.create({
      data: {
        sellerId,
        title: ai.identifiedProduct || 'Untitled item',
        photoPath: stored.photoPath,
        retailPriceCents:    ai.retailPriceCents,
        suggestedPriceCents: ai.suggestedPriceCents,
        listedPriceCents:    ai.suggestedPriceCents,
        category:            ai.category,
        identifiedProduct:   ai.identifiedProduct,
        priceSources: {
          create: ai.priceSources.map((s) => ({
            retailer:   s.retailer,
            priceCents: s.priceCents,
            url:        s.url ?? null,
          })),
        },
      },
      include: { priceSources: true },
    });

    return res.status(201).json({
      listing: serializeListing(listing, sellerId),
      ai: { confidence: ai.confidence, source: ai.source }, // for UI to show "AI suggestion" vs "static fallback"
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/listings — public, paginated LIVE listings.
listingsRouter.get('/', async (req, res, next) => {
  try {
    const parsed = listingQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
    const { q, category, page } = parsed.data;

    const where = {
      status: 'LIVE',
      ...(category ? { category } : {}),
      ...(q ? { OR: [
        { title:       { contains: q } },
        { description: { contains: q } },
      ] } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { photos: true },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      listings: items.map((l) => serializeListing(l as ListingWithSources, req.user?.id)),
      page,
      pageSize: PAGE_SIZE,
      total,
      hasMore: page * PAGE_SIZE < total,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/seller/listings — caller's own listings (any status). Mounted under /api separately.
export const sellerListingsRouter = Router();
sellerListingsRouter.get('/listings', requireAuth, requireSeller, async (req, res, next) => {
  try {
    const items = await prisma.listing.findMany({
      where: { sellerId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      include: { priceSources: true, photos: true },
    });
    res.json({ listings: items.map((l) => serializeListing(l as ListingWithSources, req.user!.id)) });
  } catch (err) {
    next(err);
  }
});

// POST /api/seller/listings/manual — create a listing manually with optional images, no AI.
sellerListingsRouter.post('/listings/manual', requireAuth, requireSeller, upload.array('images', 10), async (req, res, next) => {
  try {
    const { title, description, category, condition, costCents, retailPriceCents, listedPriceCents, quantity } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    const retail = Math.max(0, Math.round(Number(retailPriceCents) || 0));
    const listed = Math.max(0, Math.round(Number(listedPriceCents) || 0));
    const cost   = Math.max(0, Math.round(Number(costCents)        || 0));
    const qty    = Math.max(1, Math.round(Number(quantity)         || 1));

    const files = (req.files as Express.Multer.File[]) ?? [];
    const [primary, ...extras] = await Promise.all(files.map((f) => putImage(f.buffer, f.originalname, f.mimetype)));

    const listing = await prisma.listing.create({
      data: {
        sellerId:            req.user!.id,
        title:               title.trim(),
        description:         description ? String(description).trim() : null,
        category:            category    ? String(category).trim()    : null,
        condition:           condition   ? String(condition).trim()   : null,
        quantity:            qty,
        costCents:           cost,
        retailPriceCents:    retail,
        suggestedPriceCents: Math.round(retail * 0.6),
        listedPriceCents:    listed,
        photoPath:           primary?.photoPath ?? null,
        photos: extras.length > 0 ? {
          create: extras.map((s, i) => ({ photoPath: s.photoPath, position: i })),
        } : undefined,
      },
      include: { priceSources: true, photos: true },
    });
    return res.status(201).json({ listing: serializeListing(listing as ListingWithSources, req.user!.id) });
  } catch (err) {
    next(err);
  }
});

// GET /api/listings/:id — public; private fields gated by ownership.
listingsRouter.get('/:id', async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { priceSources: true, photos: true },
    });
    if (!listing) return res.status(404).json({ error: 'Not found' });

    // Non-owners can only view LIVE listings.
    const isOwner = req.user?.id === listing.sellerId;
    if (!isOwner && listing.status !== 'LIVE') return res.status(404).json({ error: 'Not found' });

    res.json({ listing: serializeListing(listing as ListingWithSources, req.user?.id) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/listings/:id — owner-only.
listingsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const parsed = listingUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });

    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.sellerId !== req.user!.id) return res.status(403).json({ error: 'Not your listing' });

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { priceSources: true, photos: true },
    });
    res.json({ listing: serializeListing(updated as ListingWithSources, req.user!.id) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/listings/:id — soft-delete (status=REMOVED).
listingsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.sellerId !== req.user!.id) return res.status(403).json({ error: 'Not your listing' });

    await prisma.listing.update({
      where: { id: req.params.id },
      data: { status: 'REMOVED' },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/listings/:id/photos — add an extra photo to an existing listing.
listingsRouter.post('/:id/photos', requireAuth, requireSeller, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image file required' });

    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Not found' });
    if (listing.sellerId !== req.user!.id) return res.status(403).json({ error: 'Not your listing' });

    const count = await prisma.listingPhoto.count({ where: { listingId: listing.id } });
    if (count >= 9) return res.status(400).json({ error: 'Maximum 10 photos per listing' });

    const stored = await putImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    const photo = await prisma.listingPhoto.create({
      data: { listingId: listing.id, photoPath: stored.photoPath, position: count },
    });

    res.status(201).json({ photo: { id: photo.id, url: publicUrl(photo.photoPath), position: photo.position } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/listings/:id/photos/:photoId — remove an extra photo.
listingsRouter.delete('/:id/photos/:photoId', requireAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Not found' });
    if (listing.sellerId !== req.user!.id) return res.status(403).json({ error: 'Not your listing' });

    await prisma.listingPhoto.deleteMany({
      where: { id: req.params.photoId, listingId: listing.id },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
