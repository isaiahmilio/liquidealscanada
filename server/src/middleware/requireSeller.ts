import type { Request, Response, NextFunction } from 'express';

export function requireSeller(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'SELLER' && req.user.role !== 'BOTH') {
    res.status(403).json({ error: 'Seller role required' });
    return;
  }
  next();
}
