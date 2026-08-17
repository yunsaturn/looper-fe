import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { impactApi } from '@/entities/impact/api';
import { tradeApi } from '@/entities/trade/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import {
  CARBON_DISCLAIMER,
  calculateAvoidedCarbon,
  formatCarbon,
} from '@/shared/lib/carbon';
import { Button } from '@/shared/ui/Button';
import { CarbonHeroCard, ImpactStatCard } from '@/shared/ui/ImpactCards';
import { Skeleton } from '@/shared/ui/feedback';

/**
 * 거래 완료 결과.
 *
 * 완료 직후 이번 활동의 절감량과 개인·캠퍼스 누적을 함께 안내한다.
 * 누적 수치는 서버가 계산한 값을 그대로 쓰고, 이번 건 절감량만
 * 무게 × 섹터 회피계수로 화면에서 보여준다.
 */
export function TradeCompletePage() {
  const { tradeId = '' } = useParams();
  const navigate = useNavigate();
  const campusId = useAuthStore((s) => s.campusId);

  const trade = useQuery({
    queryKey: queryKeys.trades.detail(tradeId),
    queryFn: () => tradeApi.detail(tradeId),
    enabled: Boolean(tradeId),
  });

  const impact = useQuery({
    queryKey: queryKeys.impact.me,
    queryFn: impactApi.me,
  });

  const campus = useQuery({
    queryKey: queryKeys.impact.campus(campusId ?? ''),
    queryFn: () => impactApi.campus(campusId!),
    enabled: Boolean(campusId),
  });

  if (trade.isPending || impact.isPending) {
    return (
      <div className="mx-auto grid max-w-lg gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const thisActivityKg =
    trade.data && trade.data.weight_kg
      ? calculateAvoidedCarbon(trade.data.weight_kg, trade.data.carbon_sector)
      : null;

  // 각주는 서버가 준 문구를 우선 쓰고, 없을 때만 상수로 폴백한다.
  const disclaimer = impact.data?.disclaimer ?? CARBON_DISCLAIMER;

  return (
    <div className="mx-auto grid max-w-lg gap-5 py-6 text-center">
      <div>
        <p className="text-4xl">🌱</p>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">
          거래가 완료되었어요
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {trade.data?.title} 이(가) 캠퍼스 안에서 한 번 더 순환했어요.
        </p>
      </div>

      {thisActivityKg !== null && (
        <CarbonHeroCard
          className="text-left"
          label="이번 거래로 줄인 예상 탄소"
          kgCO2e={thisActivityKg}
          disclaimer={disclaimer}
          caption={`무게 ${trade.data?.weight_kg}kg 기준으로 계산했어요.`}
        />
      )}

      <div className="grid grid-cols-2 gap-3 text-left">
        <ImpactStatCard
          label="내 누적 절감 (추정)"
          value={
            impact.data
              ? formatCarbon(impact.data.estimated_carbon_saved_kg_co2e)
              : '—'
          }
        />
        <ImpactStatCard
          label="캠퍼스 누적 절감 (추정)"
          value={
            campus.data
              ? formatCarbon(campus.data.estimated_carbon_saved_kg_co2e)
              : '—'
          }
        />
      </div>

      <div className="mt-2 grid gap-2">
        <Button fullWidth onClick={() => navigate(ROUTES.IMPACT)}>
          내 임팩트 보러 가기
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate(ROUTES.HOME, { replace: true })}
        >
          홈으로
        </Button>
      </div>
    </div>
  );
}
