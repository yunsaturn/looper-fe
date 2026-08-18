import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { notificationApi } from '@/entities/notification/api';
import type { NotificationItem } from '@/entities/notification/types';
import { queryKeys } from '@/shared/api/queryKeys';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import { formatRelative } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { FilterChips } from '@/shared/ui/FilterChips';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/useToast';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 알림 목록.
 *
 * 알림을 누르면 해당 거래·대여로 이동하면서 읽음 처리한다. 읽음은 서버가
 * 단일 출처이므로 성공 후 목록과 미읽음 수를 함께 무효화한다 — 헤더 배지가
 * 목록과 어긋나면 사용자는 어느 쪽을 믿어야 할지 알 수 없다.
 */
const FILTERS = [{ value: 'unread', label: '안 읽음' }] as const;

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [unreadOnly, setUnreadOnly] = useState<'unread' | undefined>();

  const filters = { unread_only: unreadOnly === 'unread', size: 50 };
  const notifications = useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => notificationApi.list(filters),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: refresh,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: (res) => {
      refresh();
      toast.show(`알림 ${res.updated_count}건을 읽음 처리했어요.`, 'success');
    },
  });

  const items = notifications.data?.content ?? [];
  const hasUnread = items.some((n) => !n.read);

  return (
    <>
      <PageTitle
        title="알림"
        description="거래와 대여의 진행 상황을 알려드려요."
        action={
          hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              loading={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              전체 읽음
            </Button>
          )
        }
      />

      <FilterChips
        className="mb-4"
        options={FILTERS}
        value={unreadOnly}
        onChange={setUnreadOnly}
        allLabel="전체"
      />

      {notifications.isPending ? (
        <div className="grid gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.isError ? (
        <ErrorState
          error={notifications.error}
          onRetry={() => notifications.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={unreadOnly ? '안 읽은 알림이 없어요' : '아직 알림이 없어요'}
          description="거래를 신청하거나 대여에 지원하면 진행 상황을 여기로 알려드려요."
        />
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <NotificationRow
                item={item}
                onOpen={() => !item.read && markRead.mutate(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen: () => void;
}) {
  const to =
    item.resource_type === 'TRADE'
      ? buildPath(ROUTES.TRADE_DETAIL, { tradeId: item.resource_id })
      : buildPath(ROUTES.RENTAL_DETAIL, { rentalId: item.resource_id });

  return (
    <Link
      to={to}
      onClick={onOpen}
      className={cn(
        'flex gap-3 rounded-card border p-4 transition-colors',
        item.read
          ? 'border-ink-200 hover:border-brand-300'
          : 'border-brand-300 bg-brand-100',
      )}
    >
      {/* 안 읽은 알림만 점을 찍는다. 읽은 것과 한눈에 구분되어야 한다 */}
      <span
        aria-hidden
        className={cn(
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          item.read ? 'bg-transparent' : 'bg-brand-500',
        )}
      />
      <div className="min-w-0 grow">
        <p
          className={cn(
            'text-sm',
            item.read ? 'font-medium text-ink-700' : 'font-bold text-ink-900',
          )}
        >
          {item.title}
        </p>
        <p className="mt-0.5 text-sm text-ink-600">{item.message}</p>
        <p className="mt-1 text-xs text-ink-400">
          {formatRelative(item.created_at)}
          {!item.read && <span className="sr-only"> · 읽지 않음</span>}
        </p>
      </div>
    </Link>
  );
}
