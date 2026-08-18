import { useQuery } from '@tanstack/react-query';

import { impactApi } from '@/entities/impact/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { CATEGORY_LABEL, type Category } from '@/shared/config/categories';
import { CARBON_SOURCE } from '@/shared/lib/carbon';
import { ErrorState, Skeleton } from '@/shared/ui/feedback';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 계산식·계수 출처 화면.
 *
 * 기획서 R3 대응의 핵심 화면이다. 정확도 대신 **검증 가능한 투명성**을
 * 내세운다 — 계산식을 공개하고, 계수의 출처·기준일·표본 수를 함께 보여주고,
 * 데이터의 한계를 선제적으로 밝힌다.
 */
export function ImpactMethodPage() {
  const refs = useQuery({
    queryKey: queryKeys.carbonReferences,
    queryFn: impactApi.carbonReferences,
  });

  return (
    <>
      <PageTitle
        title="탄소 절감량은 어떻게 계산하나요"
        description="모든 수치는 실측값이 아닌 예상 절감량입니다."
      />

      {refs.isPending ? (
        <div className="grid max-w-2xl gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : refs.isError ? (
        <ErrorState error={refs.error} onRetry={() => refs.refetch()} />
      ) : (
        <div className="grid max-w-2xl gap-5">
          <section className="rounded-card bg-brand-50 p-4 ring-1 ring-brand-100">
            <h2 className="text-sm font-bold text-brand-800">계산식</h2>
            <p className="mt-2 font-mono text-sm text-brand-800">
              {refs.data.formula}
            </p>
            <p className="mt-3 text-sm text-brand-700/80">
              회피계수 = 섹터 탄소집약도 × 생산단계 비중 × 대체율(
              {refs.data.substitution_rate})
            </p>
            <p className="mt-2 text-xs text-brand-700/70">{refs.data.notice}</p>
          </section>

          <section className="rounded-card border border-ink-200 p-4">
            <h2 className="text-sm font-bold text-ink-900">섹터별 계수</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-md text-left text-sm">
                <thead className="text-xs text-ink-500">
                  <tr className="border-b border-ink-200">
                    <th className="py-2 font-medium">섹터</th>
                    <th className="py-2 font-medium">회피계수</th>
                    <th className="py-2 font-medium">생산단계 비중</th>
                    <th className="py-2 font-medium">표본 수</th>
                  </tr>
                </thead>
                <tbody>
                  {(refs.data.sectors ?? []).map((s) => (
                    <tr key={s.sector} className="border-b border-ink-100">
                      <td className="py-2.5">
                        {CATEGORY_LABEL[s.sector as Category] ?? s.sector}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {s.avoidance_factor_kg_co2e_per_kg}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {(s.production_stage_ratio * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 tabular-nums text-ink-500">
                        {s.sample_count.toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-400">
              생산단계 비중은 재사용으로 실제 회피되는 구간(원료~제조)의
              비율입니다. 사용·폐기 단계는 다음 사용자가 그대로 발생시키므로
              제외했습니다.
            </p>
          </section>

          <section className="rounded-card border border-ink-200 p-4">
            <h2 className="text-sm font-bold text-ink-900">출처</h2>
            <ul className="mt-3 grid gap-2 text-sm text-ink-600">
              {(refs.data.sources ?? []).map((source) => (
                <li key={source.name} className="flex flex-wrap gap-1.5">
                  <span className="font-medium text-ink-800">
                    {source.name}
                  </span>
                  <span className="text-ink-400">({source.published_year})</span>
                  {source.reported_substitution_rate != null && (
                    <span className="text-ink-400">
                      · 대체율 {source.reported_substitution_rate}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-400">
              계수 기준일: {refs.data.reference_date}
            </p>
          </section>

          {/* 한계를 선제적으로 공개하는 것이 이 화면의 목적이다 */}
          <section className="rounded-card border border-ink-200 p-4">
            <h2 className="text-sm font-bold text-ink-900">데이터의 한계</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-ink-600">
              {CARBON_SOURCE.limitations.map((limitation) => (
                <li key={limitation} className="flex gap-2">
                  <span className="text-ink-300">·</span>
                  {limitation}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
