import { z } from 'zod';

export const Role          = z.enum(['BUYER', 'SELLER', 'BOTH']);
export const ListingStatus = z.enum(['DRAFT', 'LIVE', 'SOLD', 'REMOVED']);

// Public signups are always BUYER. The seller account is provisioned out-of-band
// (via prisma/seed.ts or by manually updating the User row in the DB).
export const signupSchema = z.object({
  email:    z.string().email().max(254),
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// Updates a draft/live listing. All fields optional; only present ones are written.
export const listingUpdateSchema = z.object({
  title:            z.string().min(1).max(200).optional(),
  description:      z.string().max(5000).optional(),
  category:         z.string().max(100).optional(),
  condition:        z.string().max(50).optional(),
  quantity:         z.number().int().min(1).max(10_000).optional(),
  costCents:        z.number().int().min(0).max(10_000_000).optional(),
  listedPriceCents: z.number().int().min(0).max(10_000_000).optional(),
  status:           ListingStatus.optional(),
});

export const listingQuerySchema = z.object({
  q:        z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  page:     z.coerce.number().int().min(1).max(1000).optional().default(1),
  sort:     z.enum(['newest', 'price_asc', 'price_desc', 'most_viewed', 'discount']).optional().default('newest'),
});
