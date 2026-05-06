import { prisma } from '../lib/db.js';

// Images are stored as binary blobs in PostgreSQL.
// This means photos survive Railway redeploys with no external storage service needed.

export interface StoredImage {
  photoPath: string; // stores the Image row ID
  publicUrl: string;
}

export async function putImage(buffer: Buffer, _originalName: string, mimeType = 'image/jpeg'): Promise<StoredImage> {
  const image = await prisma.image.create({
    data: { data: buffer, mimeType },
  });
  return { photoPath: image.id, publicUrl: publicUrl(image.id) };
}

export function publicUrl(photoPath: string): string {
  // Already a full URL (e.g. migrated S3 path) — pass through.
  if (/^https?:\/\//.test(photoPath)) return photoPath;
  return `/api/images/${photoPath}`;
}
