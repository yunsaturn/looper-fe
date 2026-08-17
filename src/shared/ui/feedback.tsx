import { cn } from '@/shared/lib/cn';
import { ApiError } from '@/shared/api/errors';
import { Button } from './Button';

/** 목록이 비었을 때 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink-200 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-ink-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * 오류 안내.
 *
 * 서버가 상태 전이 실패 시 현재 상태를 함께 내려주므로
 * "지금은 신청할 수 없어요 (현재: 예약 중)" 처럼 구체적으로 알려준다.
 */
export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const apiError = error instanceof ApiError ? error : null;

  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-tone-danger-fg/20 bg-tone-danger-bg/40 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-tone-danger-fg">
        {apiError?.message ?? '문제가 발생했어요.'}
      </p>
      {apiError?.currentStatus && (
        <p className="mt-1 text-xs text-ink-500">
          현재 상태: {apiError.currentStatus}
        </p>
      )}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-btn bg-ink-100', className)} />
  );
}

/** 목록 로딩 자리표시자 */
export function CardSkeletonGrid({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-card border border-ink-100 p-4"
          aria-hidden="true"
        >
          <Skeleton className="h-32 w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
