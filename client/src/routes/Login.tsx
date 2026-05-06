import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏷️</div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your LiquiDealsCanada account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium transition active:scale-[0.98] shadow-sm"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/signup" className="text-brand-700 font-medium hover:underline">
              Create a free account
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-center text-xs text-slate-400">Try a demo account:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setEmail('buyer@liquidealscanada.test'); setPassword('buyerpass123'); }}
              className="flex-1 text-xs border border-slate-200 rounded-xl py-2 px-3 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition text-left"
            >
              <span className="font-semibold block text-slate-700">Buyer demo</span>
              <span className="text-slate-400">Browse &amp; save deals</span>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('demo@liquidealscanada.test'); setPassword('demopass123'); }}
              className="flex-1 text-xs border border-slate-200 rounded-xl py-2 px-3 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition text-left"
            >
              <span className="font-semibold block text-slate-700">Seller demo</span>
              <span className="text-slate-400">List &amp; manage items</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{props.label}</span>
      <input
        type={props.type}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        required={props.required}
        placeholder={props.placeholder}
        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
      />
    </label>
  );
}
