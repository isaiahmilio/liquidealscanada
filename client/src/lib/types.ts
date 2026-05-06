// Shared client-side types. Mirror of fields returned by serializeListing in server/routes/listings.ts.

export interface PriceSource {
  retailer: string;
  priceCents: number;
  url: string | null;
}

export interface ListingPhoto {
  id: string;
  url: string;
}

export interface PublicListing {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  category: string | null;
  photoUrl: string | null;
  photos: ListingPhoto[];
  retailPriceCents: number;
  listedPriceCents: number;
  identifiedProduct: string | null;
  condition: string | null;
  status: 'DRAFT' | 'LIVE' | 'SOLD' | 'REMOVED';
  createdAt: string;
  updatedAt: string;
  priceSources: PriceSource[];
}

export interface OwnerListing extends PublicListing {
  suggestedPriceCents: number;
  costCents: number;
}

export interface ListingsPage {
  listings: PublicListing[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
