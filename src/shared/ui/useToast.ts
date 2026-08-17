import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

/**
 * Toast 컨텍스트와 훅은 컴포넌트 파일과 분리한다.
 * 컴포넌트 파일이 컴포넌트 외의 것도 export 하면 Fast Refresh 가 깨진다.
 */
export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast 는 ToastProvider 안에서만 쓸 수 있습니다.');
  return ctx;
}
