import type { Request, Response, NextFunction } from 'express';
import { getSessionUser, sessionCookieName } from '../services/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
    }
  }
}

// Soft middleware: attaches req.user when a session cookie is present and valid.
// Does not reject anonymous requests — use requireAuth for that.
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const sid = req.cookies?.[sessionCookieName];
  const user = await getSessionUser(sid);
  if (user) req.user = { id: user.id, email: user.email, role: user.role };
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}
