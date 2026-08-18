import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { impactApi } from '@/entities/impact/api';
import { tradeApi } from '@/entities/trade/api';
import { rentalApi } from '@/entities/rental/api';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  TRADE_TYPE_FILTERS,
  TRADE_TYPE_LABEL,
  type TradeType,
} from '@/shared/config/categories';
import { LAYOUT, ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { formatCarbon } from '@/shared/lib/carbon';
import { formatAmount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { FilterChips } from '@/shared/ui/FilterChips';
import { ItemCard } from '@/shared/ui/ItemCard';
import { RentalCard } from '@/shared/ui/RentalCard';
import { CardSkeletonGrid, EmptyState } from '@/shared/ui/feedback';
import { ImpactStatCard } from '@/shared/ui/ImpactCards';
import { SearchIcon } from '@/shared/ui/icons';

/**
 * 홈 피드 — Figma 기준.
 *   임팩트 요약 3칸 → 최신 게시물(유형 필터) → 대여 요청
 *
 * 모바일에서는 임팩트가 하단 탭에 없으므로 이 카드가 대시보드 진입점이다.
 */
export function HomePage() {
  const navigate = useNavigate();
  const campusId = useAuthStore((s) => s.campusId);
  const [tradeType, setTradeType] = useState<TradeType | undefined>();

  const impact = useQuery({
    queryKey: queryKeys.impact.me(),
    queryFn: () => impactApi.me(),
  });

  const campusImpact = useQuery({
    queryKey: queryKeys.impact.campus(campusId ?? ''),
    queryFn: () => impactApi.campus(campusId!),
    enabled: Boolean(campusId),
  });

  const tradeFilters = { trade_type: tradeType, size: 8 };
  const trades = useQuery({
    queryKey: queryKeys.trades.list(tradeFilters),
    queryFn: () => tradeApi.list(tradeFilters),
  });

  const rentalFilters = { status: 'RECRUITING' as const, size: 3 };
  const rentals = useQuery({
    queryKey: queryKeys.rentals.list(rentalFilters),
    queryFn: () => rentalApi.list(rentalFilters),
  });

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-xl font-bold text-ink-900 md:text-2xl">홈</h1>
        <p className="mt-1 text-sm text-ink-500">
          필요한 물건, 캠퍼스 안에서 순환해요
        </p>

        <button
          type="button"
          onClick={() => navigate(ROUTES.SEARCH)}
          className="mt-4 flex h-11 w-full items-center gap-2 rounded-btn border border-ink-200 px-3.5 text-sm text-ink-400 hover:border-ink-300"
        >
          <SearchIcon className="h-4 w-4" />
          물건 이름, 카테고리로 검색
        </button>

        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => navigate(ROUTES.TRADE_NEW)}
            className="flex-1 md:flex-none"
          >
            게시물 등록
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.RENTAL_NEW)}
            className="flex-1 md:flex-none"
          >
            대여 요청 등록
          </Button>
        </div>
      </section>

      {/* 임팩트 요약 — 실측값(절약 금액)을 먼저, 추정값(탄소)을 뒤에 둔다 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900">임팩트</h2>
          <Link
            to={ROUTES.IMPACT}
            className="text-sm text-ink-500 underline hover:text-brand-700"
          >
            자세히 보기
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <ImpactStatCard
            label="내 절약 금액"
            value={impact.data ? formatAmount(impact.data.saved_amount) : '—'}
            caption="내 완료 활동 기준"
          />
          <ImpactStatCard
            label="내 탄소 절감 (추정)"
            value={
              impact.data
                ? formatCarbon(impact.data.estimated_carbon_saved_kg_co2e)
                : '—'
            }
            caption={
              impact.data
                ? `완료 거래 ${impact.data.trade_completed_count}건 기준 · 추정치`
                : undefined
            }
          />
          <ImpactStatCard
            className="col-span-2 md:col-span-1"
            label="캠퍼스 누적 절감 (추정)"
            value={
              campusImpact.data
                ? formatCarbon(campusImpact.data.estimated_carbon_saved_kg_co2e)
                : '—'
            }
            caption="전체 완료 활동 기준 · 추정치"
          />
        </div>

        {impact.data && (
          <p className="mt-2 text-xs text-ink-400">{impact.data.disclaimer}</p>
        )}
      </section>

      {/* 최신 게시물 */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink-900">최신 게시물</h2>
          <Link
            to={ROUTES.TRADE_LIST}
            className="shrink-0 text-sm text-ink-500 underline hover:text-brand-700"
          >
            물품 탐색
          </Link>
        </div>

        <FilterChips
          className="mb-4"
          options={TRADE_TYPE_FILTERS.map((t) => ({
            value: t,
            label: TRADE_TYPE_LABEL[t],
          }))}
          value={tradeType}
          onChange={setTradeType}
        />

        {trades.isPending ? (
          <CardSkeletonGrid className={LAYOUT.listGrid} />
        ) : trades.data?.content.length ? (
          <div className={LAYOUT.listGrid}>
            {trades.data.content.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 게시물이 없어요"
            description="첫 게시물을 등록해 캠퍼스 순환을 시작해보세요."
            action={
              <Button size="sm" onClick={() => navigate(ROUTES.TRADE_NEW)}>
                게시물 등록
              </Button>
            }
          />
        )}
      </section>

      {/* 대여 요청 */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink-900">대여 요청</h2>
          <Link
            to={ROUTES.RENTAL_LIST}
            className="shrink-0 text-sm text-ink-500 underline hover:text-brand-700"
          >
            요청 목록 전체 보기
          </Link>
        </div>

        {rentals.isPending ? (
          <CardSkeletonGrid
            count={3}
            className={LAYOUT.rentalGrid}
            withMedia={false}
          />
        ) : rentals.data?.content.length ? (
          <div className={LAYOUT.rentalGrid}>
            {rentals.data.content.map((item) => (
              <RentalCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="지금은 모집 중인 요청이 없어요"
            description="필요한 물건이 있다면 요청을 올려보세요."
          />
        )}
      </section>
    </div>
  );
}
