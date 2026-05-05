import { hash, verify } from '@node-rs/argon2';
import crypto from 'node:crypto';
import { prisma } from '../lib/db.js';

const SESSION_COOKIE = 'lqd_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export const sessionCookieName = SESSION_COOKIE;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try { return await verify(stored, plain); } catch { return false; }
}

export async function createSession(userId: string) {
  const id = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { id, userId, expiresAt } });
  return { id, expiresAt };
}

export async function getSessionUser(sessionId: string | undefined) {
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function deleteSession(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  };
}

export function publicUser<T extends { id: string; email: string; role: string }>(u: T) {
  return { id: u.id, email: u.email, role: u.role };
}
