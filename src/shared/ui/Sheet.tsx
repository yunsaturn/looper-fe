import { useEffect } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from './Button';
import { CloseIcon } from './icons';

/**
 * 모바일에서는 하단에서 올라오는 BottomSheet, 데스크톱에서는 중앙 Modal.
 *
 * 분기를 이 컴포넌트 안에 가둔다. 화면마다 `md:` 분기를 흩뿌리면
 * 24시간 안에 일관성이 깨진다.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // 열려 있는 동안 배경 스크롤을 막고, ESC 로 닫는다.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 bg-ink-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[85vh] w-full flex-col bg-white',
          // 모바일: 하단 시트 (위쪽 모서리만 둥글게)
          'rounded-t-2xl pb-safe',
          // 데스크톱: 중앙 모달
          'md:max-w-md md:rounded-2xl md:pb-0',
        )}
      >
        <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1 text-ink-500 hover:bg-ink-50"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="grow overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="border-t border-ink-100 px-5 py-4">{footer}</footer>
        )}
      </div>
    </div>
  );
}

/** 되돌릴 수 없는 동작(거래 완료 등) 앞에 세우는 확인 대화상자 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = '확인',
  confirmVariant = 'primary',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            취소
          </Button>
          <Button
            variant={confirmVariant}
            fullWidth
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-ink-600">{description}</p>
    </Sheet>
  );
}
