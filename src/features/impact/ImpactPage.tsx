import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { impactApi } from '@/entities/impact/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { CATEGORY_LABEL } from '@/shared/config/categories';
import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { formatCarbon } from '@/shared/lib/carbon';
import { formatPrice } from '@/shared/lib/format';
import { CarbonHeroCard, ImpactStatCard } from '@/shared/ui/ImpactCards';
import { ErrorState, Skeleton } from '@/shared/ui/feedback';

/**
 * 임팩트 대시보드 (개인 + 캠퍼스).
 *
 * 기획서 표기 우선순위를 레이아웃으로 강제한다.
 *   ① 절약 금액 ② 줄인 폐기물 kg  ← 실측값, 위쪽
 *   ③ 예상 탄소 절감량            ← 추정값, 아래쪽 + 각주
 *
 * 각주 문구는 서버 응답의 `disclaimer` 를 그대로 쓴다.
 */
export function ImpactPage() {
  const campusId = useAuthStore((s) => s.campusId);

  const me = useQuery({ queryKey: queryKeys.impact.me, queryFn: impactApi.me });
  const campus = useQuery({
    queryKey: queryKeys.impact.campus(campusId ?? ''),
    queryFn: () => impactApi.campus(campusId!),
    enabled: Boolean(campusId),
  });

  if (me.isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (me.isError) {
    return <ErrorState error={me.error} onRetry={() => me.refetch()} />;
  }

  const data = me.data;
  // BE 가 non_null 직렬화라 비어 있으면 필드 자체가 빠진다
  const monthlyTrend = data.monthly_trend ?? [];
  const maxTrend = Math.max(
    ...monthlyTrend.map((p) => p.estimated_carbon_saved_kg_co2e),
    1,
  );

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-xl font-bold text-ink-900 md:text-2xl">
          탄소 절감 기록
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          나의 실천부터 캠퍼스 전체 변화까지 확인해요.
        </p>
      </div>

      {/* 개인 — 실측값 먼저 */}
      <section className="grid gap-3">
        <h2 className="text-base font-bold text-ink-900">나의 대시보드</h2>

        <div className="grid grid-cols-2 gap-3">
          <ImpactStatCard
            label="절약한 금액"
            value={formatPrice(data.saved_amount)}
            caption="실측값"
          />
          <ImpactStatCard
            label="줄인 폐기물"
            value={data.waste_reduced_kg.toLocaleString('ko-KR')}
            unit="kg"
            caption="실측값"
          />
        </div>

        <CarbonHeroCard
          label="나의 누적 예상 절감량"
          kgCO2e={data.estimated_carbon_saved_kg_co2e}
          disclaimer={data.disclaimer}
        />

        <div className="grid grid-cols-3 gap-3">
          <ImpactStatCard
            label="거래 완료"
            value={String(data.trade_completed_count)}
            unit="건"
          />
          <ImpactStatCard
            label="나눔"
            value={String(data.sharing_count)}
            unit="건"
          />
          <ImpactStatCard
            label="대여 완료"
            value={String(data.rental_completed_count)}
            unit="건"
          />
        </div>
      </section>

      {/* 월별 추이 */}
      {monthlyTrend.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold text-ink-900">월별 추이</h2>
          <div className="rounded-card border border-ink-200 p-4">
            <ul className="grid gap-3">
              {monthlyTrend.map((point) => (
                <li key={point.month} className="grid gap-1.5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-ink-600">{point.month}</span>
                    <span className="font-semibold text-ink-900 tabular-nums">
                      {formatCarbon(point.estimated_carbon_saved_kg_co2e)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-chip bg-ink-100">
                    <div
                      className="h-full rounded-chip bg-brand-500"
                      style={{
                        width: `${(point.estimated_carbon_saved_kg_co2e / maxTrend) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-400">{data.disclaimer}</p>
          </div>
        </section>
      )}

      {/* 캠퍼스 — 개인 실명·거래 상세는 공개하지 않는다 */}
      {campus.data && (
        <section className="grid gap-3">
          <h2 className="text-base font-bold text-ink-900">캠퍼스 대시보드</h2>

          <CarbonHeroCard
            label={`${campus.data.campus.name} 누적 예상 절감량`}
            kgCO2e={campus.data.estimated_carbon_saved_kg_co2e}
            disclaimer={campus.data.disclaimer}
            caption={`참여자 ${campus.data.participant_count.toLocaleString('ko-KR')}명 · 완료 활동 ${campus.data.completed_activity_count.toLocaleString('ko-KR')}건`}
          />

          <div className="rounded-card border border-ink-200 p-4">
            <h3 className="text-sm font-bold text-ink-900">카테고리별 비중</h3>
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

          <div className="flex items-center justify-between gap-3 rounded-card border border-ink-200 p-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900">캠퍼스 순위</h3>
              <p className="mt-0.5 text-xs text-ink-500">
                전체 캠퍼스 중 누적 절감량 기준
              </p>
            </div>
            <p className="text-2xl font-bold text-brand-700 tabular-nums">
              {campus.data.campus_rank}
              <span className="ml-0.5 text-base font-semibold">위</span>
            </p>
          </div>
        </section>
      )}

      <Link
        to={ROUTES.IMPACT_METHOD}
        className="rounded-card border border-ink-200 p-4 text-sm text-ink-600 hover:border-brand-300"
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
