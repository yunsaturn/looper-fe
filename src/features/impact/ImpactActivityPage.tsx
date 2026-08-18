import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { impactApi } from '@/entities/impact/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { CATEGORY_LABEL } from '@/shared/config/categories';
import { ROUTES } from '@/shared/config/navigation';
import { formatCarbon } from '@/shared/lib/carbon';
import { formatDateTime } from '@/shared/lib/format';
import { ErrorState, Skeleton } from '@/shared/ui/feedback';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 환경 기여 계산 상세.
 *
 * 완료된 활동 하나가 어떻게 그 숫자가 됐는지를 끝까지 펼쳐 보여준다.
 * 기획서 R3 대응의 마지막 조각이다 — 계산식 화면이 '우리는 이렇게 계산한다'
 * 라면, 이 화면은 '이 거래는 이렇게 계산됐다' 를 증명한다.
 *
 * 값은 완료 시점의 스냅샷이라 나중에 계수가 바뀌어도 이 숫자는 안 바뀐다.
 */
export function ImpactActivityPage() {
  const { activityId = '' } = useParams();

  const activity = useQuery({
    queryKey: queryKeys.impactActivity(activityId),
    queryFn: () => impactApi.activity(activityId),
    enabled: Boolean(activityId),
  });

  if (activity.isPending) {
    return (
      <div className="grid max-w-2xl gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (activity.isError) {
    return (
      <ErrorState error={activity.error} onRetry={() => activity.refetch()} />
    );
  }

  const d = activity.data;

  return (
    <>
      <PageTitle
        title="이 활동은 이렇게 계산했어요"
        description={`${d.activity_type === 'TRADE' ? '거래' : '대여'} · ${formatDateTime(d.calculated_at)} 기준`}
      />

      <div className="grid max-w-2xl gap-4">
        <section className="rounded-card bg-brand-100 p-4">
          <p className="text-sm font-semibold text-brand-800">
            이 활동의 예상 절감량
          </p>
          <p className="mt-2 text-3xl font-extrabold text-brand-900 tabular-nums">
            {formatCarbon(d.estimated_carbon_saved_kg_co2e)}
          </p>
          <p className="mt-2 font-mono text-xs text-brand-800/80">
            {d.formula}
          </p>
        </section>

        <section className="rounded-card border border-ink-200 p-4">
          <h2 className="text-sm font-bold text-ink-900">대입한 값</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="물품 무게" value={`${d.weight_kg} kg`} />
            <Row label="적용 섹터" value={CATEGORY_LABEL[d.carbon_sector]} />
            <Row
              label="섹터 탄소집약도"
              value={`${d.sector_carbon_intensity} kgCO₂e/kg`}
            />
            <Row
              label="생산단계 비중"
              value={`${(d.production_stage_ratio * 100).toFixed(1)}%`}
            />
            <Row label="적용 대체율" value={String(d.substitution_rate)} />
            <Row
              label="회피계수"
              value={`${d.avoidance_factor_kg_co2e_per_kg} kgCO₂e/kg`}
            />
          </dl>
        </section>

        <section className="rounded-card border border-ink-200 p-4">
          <h2 className="text-sm font-bold text-ink-900">근거와 한계</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row
              label="연구 원자료 대체율"
              value={String(d.reported_substitution_rate)}
            />
            <Row label="계수 기준일" value={d.reference_date} />
            <Row label="산출 방법" value={d.calculation_method} />
          </dl>

          {d.is_estimate && (
            <p className="mt-3 rounded-btn bg-ink-50 px-3 py-2.5 text-xs leading-relaxed text-ink-500">
              이 값은 실측이 아니라 모델 기반 <strong>예상 절감량</strong>
              입니다. 완료 시점의 계수로 계산해 저장했기 때문에, 이후 계수가
              바뀌어도 이 숫자는 달라지지 않아요.
            </p>
          )}
        </section>

        <Link
          to={ROUTES.IMPACT_METHOD}
          className="rounded-card border border-ink-200 p-4 text-sm transition-colors hover:border-brand-300"
        >
          <span className="font-semibold text-ink-900">
            계수는 어디서 왔나요?
          </span>
          <p className="mt-1 text-xs text-ink-500">
            섹터별 계수의 출처와 데이터의 한계를 확인할 수 있어요.
          </p>
        </Link>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-800">{value}</dd>
    </div>
  );
}
