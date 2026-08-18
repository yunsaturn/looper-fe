import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { userApi } from '@/entities/user/api';
import type {
  ActivityItem,
  ActivityResourceType,
  ActivityRole,
} from '@/entities/user/types';
import { queryKeys } from '@/shared/api/queryKeys';
import { TRADE_TYPE_LABEL, type TradeType } from '@/shared/config/categories';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import type { RentalStatus, TradeStatus } from '@/shared/config/status';
import { formatDateTime, formatRelative } from '@/shared/lib/format';
import { FilterChips } from '@/shared/ui/FilterChips';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { TrustScoreBadge } from '@/shared/ui/TrustScoreBadge';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/feedback';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 내 활동 — 작성·신청한 거래와 요청·지원한 대여를 한 목록으로.
 *
 * 예전에는 캠퍼스 거래 목록을 받아 화면에서 작성자로 걸렀다. 서버에
 * `GET /api/v1/users/me/activities` 가 생기면서 그 우회를 걷어냈다.
 * 이제 대여까지 한 화면에서 보이고, 페이지가 넘어가도 누락되지 않는다.
 *
 * 상태 문자열은 거래 상태일 수도 대여 상태일 수도 있어서 resource_type 을
 * 보고 어떤 뱃지로 그릴지 정한다.
 */

const TYPE_OPTIONS = [
  { value: 'TRADE', label: '거래' },
  { value: 'RENTAL', label: '대여' },
] as const;

const ROLE_OPTIONS = [
  { value: 'OWNER', label: '내가 올린 거래' },
  { value: 'APPLICANT', label: '내가 신청한 거래' },
  { value: 'REQUESTER', label: '내가 요청한 대여' },
  { value: 'OFFERER', label: '내가 빌려준 대여' },
] as const;

export function MyActivitiesPage() {
  const [resourceType, setResourceType] = useState<
    Exclude<ActivityResourceType, 'ALL'> | undefined
  >();
  const [role, setRole] = useState<Exclude<ActivityRole, 'ALL'> | undefined>();

  const filters = useMemo(
    () => ({
      resource_type: resourceType ?? ('ALL' as const),
      role: role ?? ('ALL' as const),
      size: 50,
    }),
    [resourceType, role],
  );

  const activities = useQuery({
    queryKey: queryKeys.activities(filters),
    queryFn: () => userApi.activities(filters),
  });

  const items = activities.data?.content ?? [];

  return (
    <>
      <PageTitle
        title="내 활동"
        description="올린 글과 신청·지원한 내역을 한곳에서 확인해요."
      />

      <div className="mb-5 grid gap-2">
        <FilterChips
          options={TYPE_OPTIONS}
          value={resourceType}
          onChange={(next) => {
            setResourceType(next);
            // 거래/대여를 바꾸면 맞지 않는 역할 필터는 풀어준다
            setRole(undefined);
          }}
        />
        <FilterChips
          options={ROLE_OPTIONS.filter((o) =>
            resourceType === 'TRADE'
              ? o.value === 'OWNER' || o.value === 'APPLICANT'
              : resourceType === 'RENTAL'
                ? o.value === 'REQUESTER' || o.value === 'OFFERER'
                : true,
          )}
          value={role}
          onChange={setRole}
          allLabel="역할 전체"
        />
      </div>

      {activities.isPending ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : activities.isError ? (
        <ErrorState
          error={activities.error}
          onRetry={() => activities.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="아직 활동이 없어요"
          description="물건을 올리거나 대여를 요청하면 여기에 쌓여요."
          action={
            <Link
              to={ROUTES.TRADE_NEW}
              className="inline-flex h-10 items-center rounded-btn bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600"
            >
              게시물 등록하기
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-500">
            총 {activities.data.total_elements.toLocaleString('ko-KR')}건
          </p>
          <ul className="grid gap-3">
            {items.map((item) => (
              <li key={`${item.resource_type}-${item.id}`}>
                <ActivityCard item={item} />
              </li>
            ))}
          </ul>
          {activities.data.has_next && (
            <p className="mt-4 text-xs text-ink-400">
              최근 {items.length}건만 보여주고 있어요.
            </p>
          )}
        </>
      )}
    </>
  );
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: '내가 올림',
  APPLICANT: '신청함',
  REQUESTER: '요청함',
  OFFERER: '빌려줌',
};

function ActivityCard({ item }: { item: ActivityItem }) {
  const isTrade = item.resource_type === 'TRADE';
  const to = isTrade
    ? buildPath(ROUTES.TRADE_DETAIL, { tradeId: item.id })
    : buildPath(ROUTES.RENTAL_DETAIL, { rentalId: item.id });

  return (
    <Link
      to={to}
      className="flex gap-3 rounded-card border border-ink-200 p-3 transition-colors hover:border-brand-300"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-btn bg-ink-100">
        {item.thumbnail_url && (
          <img
            src={item.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0 grow">
        <div className="flex flex-wrap items-center gap-1.5">
          {isTrade ? (
            <StatusBadge kind="trade" status={item.status as TradeStatus} />
          ) : (
            <StatusBadge
              kind="rental"
              status={item.status as RentalStatus}
              isOverdue={item.overdue}
            />
          )}
          <span className="rounded-chip bg-ink-50 px-2 py-0.5 text-[11px] text-ink-500">
            {ROLE_LABEL[item.role] ?? item.role}
          </span>
          {isTrade && TRADE_TYPE_LABEL[item.activity_type as TradeType] && (
            <span className="rounded-chip bg-ink-50 px-2 py-0.5 text-[11px] text-ink-500">
              {TRADE_TYPE_LABEL[item.activity_type as TradeType]}
            </span>
          )}
        </div>

        <p className="mt-1.5 truncate text-sm font-semibold text-ink-900">
          {item.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          {item.counterparty && (
            <span className="inline-flex items-center gap-1">
              {item.counterparty.nickname}
              <TrustScoreBadge score={item.counterparty.trust_score} />
            </span>
          )}
          {item.meeting_at && (
            <span>약속 {formatDateTime(item.meeting_at)}</span>
          )}
          {item.due_at && <span>반납 {formatDateTime(item.due_at)}</span>}
          <span className="text-ink-400">
            {formatRelative(item.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
