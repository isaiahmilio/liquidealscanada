import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { ReactNode } from 'react';

// Gates seller-only pages. Buyers (and signed-out users) get redirected home.
export function RequireSeller({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'SELLER' && user.role !== 'BOTH') return <Navigate to="/" replace />;
  return <>{children}</>;
}
