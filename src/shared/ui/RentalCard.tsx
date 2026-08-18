import { Link } from 'react-router-dom';

import { buildPath, ROUTES } from '@/shared/config/navigation';
import { CATEGORY_LABEL } from '@/shared/config/categories';
import {
  formatDDay,
  formatDateTime,
  formatPrice,
  formatTime,
} from '@/shared/lib/format';
import type { RentalListItem } from '@/entities/rental/types';

import { StatusBadge } from './StatusBadge';
import { UserInline } from './TrustScoreBadge';

/**
 * 대여 요청 카드.
 *
 * Figma 모바일 목록에 '한 장씩 보기 / 한눈에 보기' 토글이 있어서
 * 밀도 변형은 두지 않는다. 예전에는 '한 장씩 보기 / 한눈에 보기' 두 가지가
 * 있었지만 실제 차이가 사용 시간 한 줄뿐이라 토글이 값을 하지 못했다.
 * 정보가 더 많은 쪽(시작~반납 전체 구간)으로 통일했다.
 */
export function RentalCard({ item }: { item: RentalListItem }) {
  return (
    <Link
      to={buildPath(ROUTES.RENTAL_DETAIL, { rentalId: item.id })}
      className="group flex flex-col gap-2.5 rounded-card border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge
            kind="rental"
            status={item.status}
            isOverdue={item.is_overdue}
          />
          <span className="rounded-chip bg-ink-50 px-2 py-0.5 text-xs text-ink-500">
            {CATEGORY_LABEL[item.category]}
          </span>
        </div>
        <span className="shrink-0 text-xs font-semibold text-ink-500">
          {formatDDay(item.start_at)}
        </span>
      </div>

      <p className="text-sm font-semibold text-ink-900 group-hover:text-brand-700">
        {item.item_name}
      </p>

      <dl className="grid gap-1 text-xs text-ink-500">
        <div className="flex gap-1.5">
          <dt className="text-ink-400">사용</dt>
          <dd>
            {formatDateTime(item.start_at)} ~ {formatTime(item.due_at)}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-ink-400">장소</dt>
          <dd>{item.pickup_zone_name}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-ink-400">사용료</dt>
          <dd>{formatPrice(item.offered_price)}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between pt-1">
        <UserInline
          nickname={item.requester.nickname}
          trustScore={item.requester.trust_score}
        />
        {item.offer_count !== undefined && (
          <span className="text-xs text-ink-400">
            지원자 {item.offer_count}명
          </span>
        )}
      </div>
    </Link>
  );
}
