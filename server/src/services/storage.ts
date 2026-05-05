import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Storage abstraction. Local-fs impl for dev; swap for S3/R2 later by changing this file.

const UPLOAD_DIR  = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000';

await fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});

export interface StoredImage {
  /** Path stored in the DB. For local-fs this is the filename. */
  photoPath: string;
  /** Absolute URL the client can fetch. */
  publicUrl: string;
}

export async function putImage(buffer: Buffer, originalName: string): Promise<StoredImage> {
  const ext = path.extname(originalName).toLowerCase().slice(0, 5) || '.jpg';
  const id  = crypto.randomBytes(16).toString('hex');
  const filename = `${id}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(fullPath, buffer);
  return { photoPath: filename, publicUrl: publicUrl(filename) };
}

export function publicUrl(photoPath: string): string {
  // If photoPath is already a full URL (e.g. when we move to S3), pass through.
  if (/^https?:\/\//.test(photoPath)) return photoPath;
  return `${PUBLIC_BASE}/uploads/${photoPath}`;
}

export async function diskPath(photoPath: string): Promise<string> {
  return path.join(UPLOAD_DIR, photoPath);
}

export async function readImage(photoPath: string): Promise<Buffer> {
  return fs.readFile(await diskPath(photoPath));
}
