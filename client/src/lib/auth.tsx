import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

export type Role = 'BUYER' | 'SELLER' | 'BOTH';
export interface User { id: string; email: string; role: Role; }

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ user: User | null }>('/api/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User }>('/api/auth/login', { email, password });
    setUser(res.user);
  };
  const signup = async (email: string, password: string) => {
    const res = await api.post<{ user: User }>('/api/auth/signup', { email, password });
    setUser(res.user);
  };
  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
