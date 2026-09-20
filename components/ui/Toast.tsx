'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * App-wide toast notifications, mounted once in app/layout.tsx.
 *
 * Zero dependencies: a small stack of self-dismissing cards, fixed bottom-right,
 * announced politely to screen readers. Forms call `toast(...)` for outcomes
 * that should outlive the component (submit failures, copies, downloads) —
 * inline field errors stay next to their input.
 */

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  leaving: boolean;
}

const VISIBLE_MS = 4000;
const LEAVE_MS = 200;
const MAX_STACK = 3;

interface ToastApi {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  // A caller outside the provider must never crash the page — log and no-op.
  return { toast: (message) => console.warn('[toast] no provider mounted:', message) };
}

const KIND_STYLE: Record<ToastKind, { border: string; icon: typeof CheckCircle2; iconColor: string }> = {
  success: { border: 'border-l-[#10B981]', icon: CheckCircle2, iconColor: 'text-[#10B981]' },
  error: { border: 'border-l-rose-500', icon: AlertTriangle, iconColor: 'text-rose-500' },
  info: { border: 'border-l-[#F59E0B]', icon: Info, iconColor: 'text-[#F59E0B]' },
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const startLeave = useCallback(
    (id: number) => {
      const timer = setTimeout(() => remove(id), LEAVE_MS);
      timers.current.set(id, timer);
    },
    [remove],
  );

  const toast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId.current++;
      setItems((prev) => {
        const next = [...prev, { id, kind, message, leaving: false }];
        // Keep the stack short — drop the oldest instead of piling up.
        return next.length > MAX_STACK ? next.slice(next.length - MAX_STACK) : next;
      });
      const timer = setTimeout(() => startLeave(id), VISIBLE_MS);
      timers.current.set(id, timer);
    },
    [startLeave],
  );

  const dismiss = useCallback(
    (id: number) => {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      startLeave(id);
    },
    [startLeave],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]"
      >
        {items.map((item) => {
          const style = KIND_STYLE[item.kind];
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2.5 bg-white border border-[#E2E8F0] ${style.border} border-l-4 rounded-xl shadow-lg px-4 py-3 sm:max-w-sm toast-enter ${item.leaving ? 'opacity-0 translate-y-1' : 'opacity-100'} transition-all duration-200`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} aria-hidden="true" />
              <p className="text-sm text-[#0A0F1E] leading-snug break-words">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="ml-1 text-[#94A3B8] hover:text-[#0A0F1E] transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
