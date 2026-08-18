import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { impactApi } from '@/entities/impact/api';
import type { ImpactPeriodParams } from '@/entities/impact/types';
import { queryKeys } from '@/shared/api/queryKeys';
import { CATEGORY_LABEL } from '@/shared/config/categories';
import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { formatPrice } from '@/shared/lib/format';
import { Select } from '@/shared/ui/Field';
import { ErrorState, Skeleton } from '@/shared/ui/feedback';

import {
  CampusRankingSection,
  CarbonBigCard,
  ForestProgressCard,
  TreeEquivalentCard,
} from './components';

/**
 * 임팩트 대시보드 (개인 + 캠퍼스).
 *
 * 디자인(임팩트 대시보드 화면)을 그대로 옮겼다.
 *   나의 대시보드   누적 절감량 · 나무 환산 · 나의 순환숲
 *   캠퍼스 임팩트   캠퍼스 누적 · 숲 규모 환산
 *   순환 랭킹       상위 3개 시상대 · 우리 캠퍼스 순위
 *
 * 화면에 나오는 모든 수치는 **서버 응답 그대로**다. 나무 환산 계수도,
 * 전월 대비 증감률도, 다음 순위까지의 격차도 서버가 계산한다. 프론트에서
 * 추정치를 만들면 그 순간 검증할 수 없는 숫자가 되기 때문이다. (R3)
 *
 * BE 가 non_null 직렬화라 값이 없는 블록은 필드 자체가 빠진다. 그래서
 * 각 카드는 데이터가 있을 때만 그린다.
 */

/** 기간 필터 — 서버가 from/to 로 구간 합산을 지원한다 */
const PERIOD_OPTIONS = [
  { value: 'all', label: '전체 기간' },
  { value: 'month', label: '이번 달' },
  { value: 'quarter', label: '최근 3개월' },
  { value: 'year', label: '올해' },
] as const;

type PeriodKey = (typeof PERIOD_OPTIONS)[number]['value'];

function toPeriodParams(key: PeriodKey): ImpactPeriodParams {
  if (key === 'all') return {};
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const from =
    key === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : key === 'quarter'
        ? new Date(now.getFullYear(), now.getMonth() - 2, 1)
        : new Date(now.getFullYear(), 0, 1);
  return { from: iso(from), to: iso(now) };
}

export function ImpactPage() {
  const campusId = useAuthStore((s) => s.campusId);
  const [period, setPeriod] = useState<PeriodKey>('all');

  const params = useMemo(() => toPeriodParams(period), [period]);

  const me = useQuery({
    queryKey: queryKeys.impact.me(params),
    queryFn: () => impactApi.me(params),
  });
  const campus = useQuery({
    queryKey: queryKeys.impact.campus(campusId ?? '', params),
    queryFn: () => impactApi.campus(campusId!, params),
    enabled: Boolean(campusId),
  });

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-900 md:text-2xl">
            탄소 절감 기록
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            나의 실천부터 캠퍼스 전체 변화까지 확인해요.
          </p>
        </div>

        <div className="w-40">
          <Select
            label="기간"
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            options={PERIOD_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </div>
      </header>

      {/* ── 나의 대시보드 ───────────────────────────── */}
      <section className="grid gap-3">
        <h2 className="text-base font-bold text-ink-900">나의 대시보드</h2>

        {me.isPending ? (
          <CardRowSkeleton />
        ) : me.isError ? (
          <ErrorState error={me.error} onRetry={() => me.refetch()} />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <CarbonBigCard
                label="지금까지 줄인 탄소"
                kgCO2e={me.data.estimated_carbon_saved_kg_co2e}
                disclaimer={me.data.disclaimer}
                badge={
                  me.data.month_over_month?.change_ratio != null && (
                    <>
                      <span aria-hidden>★</span>
                      지난달보다{' '}
                      {Math.abs(
                        Math.round(me.data.month_over_month.change_ratio * 100),
                      )}
                      %{' '}
                      {me.data.month_over_month.change_ratio >= 0
                        ? '더 절감했어요'
                        : '줄었어요'}
                    </>
                  )
                }
              />

              {me.data.tree_equivalent && (
                <TreeEquivalentCard equivalent={me.data.tree_equivalent} />
              )}

              {me.data.forest && <ForestProgressCard forest={me.data.forest} />}
            </div>

            {/*
              기획서 R3: 실측값(절약 금액·줄인 폐기물)을 추정값과 함께 둔다.
              탄소만 크게 보여주면 추정치가 실측처럼 읽힌다.
            */}
            <dl className="grid grid-cols-2 gap-3 rounded-card border border-ink-200 p-4 md:grid-cols-5">
              <Stat
                label="절약한 금액"
                value={formatPrice(me.data.saved_amount)}
                measured
              />
              <Stat
                label="줄인 폐기물"
                value={`${me.data.waste_reduced_kg.toLocaleString('ko-KR')}kg`}
                measured
              />
              <Stat
                label="거래 완료"
                value={`${me.data.trade_completed_count}건`}
              />
              <Stat label="나눔" value={`${me.data.sharing_count}건`} />
              <Stat
                label="대여 완료"
                value={`${me.data.rental_completed_count}건`}
              />
            </dl>
          </>
        )}
      </section>

      {/* ── 캠퍼스 전체 임팩트 ──────────────────────── */}
      {campus.data && (
        <section className="grid gap-3">
          <h2 className="text-base font-bold text-ink-900">
            캠퍼스 전체 임팩트
          </h2>

          <div className="grid gap-3 md:grid-cols-2">
            <CarbonBigCard
              tone="dark"
              label={`${campus.data.campus.name} 누적 예상 절감량`}
              kgCO2e={campus.data.estimated_carbon_saved_kg_co2e}
              disclaimer={campus.data.disclaimer}
              badge={
                <>
                  <span aria-hidden>★</span>
                  참여자 {campus.data.participant_count.toLocaleString('ko-KR')}
                  명 · 완료 활동{' '}
                  {campus.data.completed_activity_count.toLocaleString('ko-KR')}
                  건
                </>
              }
            />

            {campus.data.tree_equivalent && (
              <TreeEquivalentCard
                equivalent={campus.data.tree_equivalent}
                variant="forest"
              />
            )}
          </div>

          {(campus.data.category_breakdown ?? []).length > 0 && (
            <div className="rounded-card border border-ink-200 p-4">
              <h3 className="text-sm font-bold text-ink-900">
                카테고리별 비중
              </h3>
              <ul className="mt-3 grid gap-2.5">
                {(campus.data.category_breakdown ?? []).map((share) => (
                  <li key={share.category} className="grid gap-1.5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink-600">
                        {CATEGORY_LABEL[share.category]}
                      </span>
                      <span className="font-semibold text-ink-900 tabular-nums">
                        {Math.round(share.ratio * 100)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-chip bg-ink-100">
                      <div
                        className="h-full rounded-chip bg-brand-400"
                        style={{ width: `${share.ratio * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── 캠퍼스 순환 랭킹 ────────────────────────── */}
      {campus.data?.ranking && (
        <section className="grid gap-3">
          <div>
            <h2 className="text-base font-bold text-ink-900">
              캠퍼스 순환 랭킹
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              전체 캠퍼스 중 누적 절감량 기준
            </p>
          </div>
          <CampusRankingSection ranking={campus.data.ranking} />
        </section>
      )}

      <Link
        to={ROUTES.IMPACT_METHOD}
        className="rounded-card border border-ink-200 p-4 text-sm text-ink-600 transition-colors hover:border-brand-300"
      >
        <span className="font-semibold text-ink-900">
          이 숫자는 어떻게 계산하나요?
        </span>
        <p className="mt-1 text-xs text-ink-500">
          계산식과 계수 출처, 데이터의 한계를 함께 확인할 수 있어요.
        </p>
      </Link>
    </div>
  );
}

function Stat({
  label,
  value,
  measured,
}: {
  label: string;
  value: string;
  measured?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-ink-500">
        {label}
        {measured && (
          <span className="ml-1 text-[10px] font-semibold text-brand-600">
            실측
          </span>
        )}
      </dt>
      <dd className="mt-0.5 text-base font-bold text-ink-900 tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function CardRowSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-44 w-full" />
      ))}
    </div>
  );
}
