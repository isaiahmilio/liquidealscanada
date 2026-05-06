import {
  createContext, useCallback, useContext, useState, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  leaving: boolean;
}

interface ToastCtx {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);
let counter = 0;
const DURATION   = 3000;
const EXIT_DELAY = 300;

const STYLE: Record<ToastType, string> = {
  success: 'bg-brand-600 text-white',
  error:   'bg-maple-500 text-white',
  info:    'bg-slate-700 text-white',
};

const ICON: Record<ToastType, string> = {
  success: '✓',
  error:   '⚠',
  info:    'ℹ',
};

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-2.5 min-w-[220px] max-w-[340px] px-4 py-3 rounded-xl shadow-lg text-sm font-medium select-none ${STYLE[toast.type]} ${toast.leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
    >
      <span className="text-base leading-none font-bold">{ICON[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity leading-none text-base"
      >✕</button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), EXIT_DELAY);
  }, []);

  const add = useCallback((type: ToastType, message: string) => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, type, message, leaving: false }]);
    setTimeout(() => dismiss(id), DURATION);
  }, [dismiss]);

  const ctx: ToastCtx = {
    success: (msg) => add('success', msg),
    error:   (msg) => add('error',   msg),
    info:    (msg) => add('info',    msg),
  };

  return (
    <Ctx.Provider value={ctx}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="fixed z-[9999] flex flex-col gap-2 top-4 right-4 max-sm:right-auto max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:w-[calc(100vw-2rem)]"
        >
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be used within ToastProvider');
  return c;
}
