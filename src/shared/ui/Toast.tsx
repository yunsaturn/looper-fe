import { useCallback, useMemo, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { ToastContext, type ToastTone } from './useToast';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'bg-brand-600',
  error: 'bg-tone-danger-fg',
  info: 'bg-ink-800',
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId++;
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'max-w-sm rounded-btn px-4 py-3 text-sm font-medium text-white shadow-lg',
              TONE_CLASS[t.tone],
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
