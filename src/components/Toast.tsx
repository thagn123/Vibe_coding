import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, X, Sparkles, TrendingUp, Award } from 'lucide-react';
import { cn } from '../lib/utils';

// ── Types ───────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'xp' | 'levelup' | 'badge';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  xpAmount?: number;
  subtitle?: string;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, xpAmount?: number, subtitle?: string) => void;
}

// ── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

// ── Per-type config ───────────────────────────────────────────────────────────
const TOAST_CONFIG: Record<
  ToastType,
  { icon: React.ReactNode; border: string; bg: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />,
    border: 'border-green-500/30',
    bg: 'bg-green-500/5',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
  },
  xp: {
    icon: <Sparkles className="w-5 h-5 text-brand-primary shrink-0" />,
    border: 'border-brand-primary/40',
    bg: 'bg-brand-primary/5',
  },
  levelup: {
    icon: <TrendingUp className="w-5 h-5 text-yellow-400 shrink-0" />,
    border: 'border-yellow-400/40',
    bg: 'bg-yellow-400/5',
  },
  badge: {
    icon: <Award className="w-5 h-5 text-purple-400 shrink-0" />,
    border: 'border-purple-400/40',
    bg: 'bg-purple-400/5',
  },
};

// ── ToastItem ─────────────────────────────────────────────────────────────────
const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: () => void }) => {
  const cfg = TOAST_CONFIG[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.88 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl min-w-[280px] max-w-sm',
        'backdrop-blur-xl',
        cfg.border,
        cfg.bg
      )}
      style={{ background: 'rgba(2, 6, 23, 0.85)' }}
    >
      <div className="mt-0.5">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{toast.message}</p>
        {toast.xpAmount !== undefined && toast.xpAmount > 0 && (
          <p className="text-xs text-brand-primary font-bold mt-0.5">
            +{toast.xpAmount} XP earned!
          </p>
        )}
        {toast.subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{toast.subtitle}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-slate-500 hover:text-white transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

// ── ToastProvider ─────────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback(
    (type: ToastType, message: string, xpAmount?: number, subtitle?: string) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, type, message, xpAmount, subtitle }]);
      // Auto-dismiss: levelup stays longer
      const delay = type === 'levelup' ? 6000 : type === 'badge' ? 5000 : 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, delay);
    },
    []
  );

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
