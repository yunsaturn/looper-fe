import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { rentalApi } from '@/entities/rental/api';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  CATEGORY_FILTERS,
  CATEGORY_LABEL,
  type Category,
} from '@/shared/config/categories';
import {
  RENTAL_STATUS,
  RENTAL_STATUS_META,
  type RentalStatus,
} from '@/shared/config/status';
import { LAYOUT, ROUTES } from '@/shared/config/navigation';
import { Button } from '@/shared/ui/Button';
import { FilterChips } from '@/shared/ui/FilterChips';
import { RentalCard } from '@/shared/ui/RentalCard';
import { CardSkeletonGrid, EmptyState, ErrorState } from '@/shared/ui/feedback';

/** 목록 상단 상태 필터. 취소 건은 굳이 노출하지 않는다. */
const STATUS_FILTERS = [
  RENTAL_STATUS.RECRUITING,
  RENTAL_STATUS.CONFIRMED,
  RENTAL_STATUS.IN_USE,
  RENTAL_STATUS.RETURN_PENDING,
  RENTAL_STATUS.COMPLETED,
] as const;

/**
 * 대여 요청 목록.
 *
 * 기본 정렬은 시작 시간 오름차순(서버 기본값) — 임박한 요청이 먼저 온다.
 *
 * Figma 에 '한 장씩 보기 / 한눈에 보기' 토글이 있었지만 걷어냈다.
 * 두 모드의 차이가 사용 시간 한 줄뿐이라 고르는 값이 없었고, 선택지가
 * 하나 줄어드는 편이 목록을 훑는 데 낫다.
 */
export function RentalListPage() {
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | undefined>();
  /**
   * 기본은 모집 중만 보여준다. 이 목록의 제목이 '빌려줄 수 있는 요청'이라
   * 이미 끝난 요청이 상단에 오면 안 된다. (정렬은 서버 기본값인
   * start_at 오름차순이라 과거 건이 먼저 나온다)
   * 시연에서 다른 상태를 보여줘야 하므로 필터로 전환할 수 있게 둔다.
   */
  const [status, setStatus] = useState<RentalStatus | undefined>(
    RENTAL_STATUS.RECRUITING,
  );

  const filters = { category, status, size: 24 };
  const rentals = useQuery({
    queryKey: queryKeys.rentals.list(filters),
    queryFn: () => rentalApi.list(filters),
  });

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink-900 md:text-2xl">
          대여 요청
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          급하게 필요한 물건을 가까운 학생에게 요청해 보세요.
        </p>
      </div>

      <Button fullWidth onClick={() => navigate(ROUTES.RENTAL_NEW)}>
        + 대여 요청 글 작성하기
      </Button>

      <div className="grid gap-3">
        <h2 className="text-base font-bold text-ink-900">
          빌려줄 수 있는 요청
        </h2>

        <FilterChips
          options={STATUS_FILTERS.map((s) => ({
            value: s,
            label: RENTAL_STATUS_META[s].label,
          }))}
          value={status}
          onChange={setStatus}
          allLabel="전체 상태"
        />

        <FilterChips
          options={CATEGORY_FILTERS.map((c) => ({
            value: c,
            label: CATEGORY_LABEL[c],
          }))}
          value={category}
          onChange={setCategory}
          allLabel="전체"
        />
      </div>

      {rentals.isPending ? (
        <CardSkeletonGrid
          count={3}
          className={LAYOUT.rentalGrid}
          withMedia={false}
        />
      ) : rentals.isError ? (
        <ErrorState error={rentals.error} onRetry={() => rentals.refetch()} />
      ) : rentals.data.content.length ? (
        <div className={LAYOUT.rentalGrid}>
          {rentals.data.content.map((item) => (
            <RentalCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="지금은 요청이 없어요"
          description="필요한 물건이 있다면 먼저 요청을 올려보세요."
          action={
            <Button size="sm" onClick={() => navigate(ROUTES.RENTAL_NEW)}>
              대여 요청 등록
            </Button>
          }
        />
      )}
    </div>
  );
}
