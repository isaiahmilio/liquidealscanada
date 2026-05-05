import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { signupSchema, loginSchema } from '../lib/validators.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  sessionCookieName,
  sessionCookieOptions,
  publicUser,
} from '../services/auth.js';

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });

  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: 'BUYER' },
  });

  const session = await createSession(user.id);
  res.cookie(sessionCookieName, session.id, sessionCookieOptions());
  return res.status(201).json({ user: publicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const session = await createSession(user.id);
  res.cookie(sessionCookieName, session.id, sessionCookieOptions());
  return res.json({ user: publicUser(user) });
});

authRouter.post('/logout', async (req, res) => {
  const sid = req.cookies?.[sessionCookieName];
  if (sid) await deleteSession(sid);
  res.clearCookie(sessionCookieName, sessionCookieOptions());
  return res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ?? null });
});
