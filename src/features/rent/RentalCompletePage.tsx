import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { impactApi } from '@/entities/impact/api';
import { rentalApi } from '@/entities/rental/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ROUTES } from '@/shared/config/navigation';
import { formatCarbon } from '@/shared/lib/carbon';
import { Button } from '@/shared/ui/Button';
import { ImpactStatCard } from '@/shared/ui/ImpactCards';
import { Skeleton } from '@/shared/ui/feedback';

/** 반납 완료 결과 — 완료 직후 누적 임팩트를 함께 안내한다. */
export function RentalCompletePage() {
  const { rentalId = '' } = useParams();
  const navigate = useNavigate();

  const rental = useQuery({
    queryKey: queryKeys.rentals.detail(rentalId),
    queryFn: () => rentalApi.detail(rentalId),
    enabled: Boolean(rentalId),
  });

  const impact = useQuery({
    queryKey: queryKeys.impact.me,
    queryFn: impactApi.me,
  });

  if (rental.isPending || impact.isPending) {
    return (
      <div className="mx-auto grid max-w-lg gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-lg gap-5 py-6 text-center">
      <div>
        <p className="text-4xl">🤝</p>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">
          반납이 완료되었어요
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {rental.data?.item_name} 대여가 무사히 마무리됐어요. 양측 신뢰도에
          반영됩니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-left">
        <ImpactStatCard
          label="내 대여 완료"
          value={String(impact.data?.rental_completed_count ?? 0)}
          unit="건"
        />
        <ImpactStatCard
          label="내 누적 절감 (추정)"
          value={
            impact.data
              ? formatCarbon(impact.data.estimated_carbon_saved_kg_co2e)
              : '—'
          }
        />
      </div>

      {impact.data && (
        <p className="text-xs text-ink-400">{impact.data.disclaimer}</p>
      )}

      <div className="mt-2 grid gap-2">
        <Button fullWidth onClick={() => navigate(ROUTES.IMPACT)}>
          내 임팩트 보러 가기
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate(ROUTES.RENTAL_LIST, { replace: true })}
        >
          대여 목록으로
        </Button>
      </div>
    </div>
  );
}
