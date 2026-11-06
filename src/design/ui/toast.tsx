import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';
import { cx } from './cx';
import { toneClasses, type StatusTone } from './badge';

export type ToastTone = Exclude<StatusTone, 'neutral' | 'brand'>;
const toastIcons: Record<ToastTone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

export interface ToastMessage {
  id: string;
  message: string;
  tone?: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
});

const TOAST_EVENT = 'customer:toast';

export function showCustomerToast(message: string, tone: ToastTone = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, tone } }));
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, message, tone });
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; tone?: ToastTone }>;
      if (customEvent.detail?.message) {
        show(customEvent.detail.message, customEvent.detail.tone);
      }
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [show]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(current => (current?.id === toast.id ? null : current));
    }, 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-4 z-[999] max-w-[calc(100vw-32px)] -translate-x-1/2 transition-all duration-200"
        >
          <div
            className={cx(
              'pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2 text-customer-caption font-semibold shadow-customer-overlay backdrop-blur-md',
              toneClasses[toast.tone ?? 'info'].badge
            )}
          >
            {React.createElement(toastIcons[toast.tone ?? 'info'], { size: 16, className: 'shrink-0' })}
            <span className="truncate max-w-[280px]">{toast.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
