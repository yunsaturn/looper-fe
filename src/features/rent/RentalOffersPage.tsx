import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { rentalApi } from '@/entities/rental/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ApiError } from '@/shared/api/errors';
import { OFFER_STATUS } from '@/shared/config/status';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/Sheet';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { TrustScoreBadge } from '@/shared/ui/TrustScoreBadge';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/useToast';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 지원자 목록 (요청자 전용).
 * 신뢰도와 메시지를 보고 한 명을 선택하면 대여가 확정된다.
 */
export function RentalOffersPage() {
  const { rentalId = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [pendingSelectId, setPendingSelectId] = useState<string | null>(null);

  const offers = useQuery({
    queryKey: queryKeys.rentals.offers(rentalId),
    queryFn: () => rentalApi.offers(rentalId),
    enabled: Boolean(rentalId),
  });

  const select = useMutation({
    mutationFn: (offerId: string) => rentalApi.selectOffer(rentalId, offerId),
    onSuccess: () => {
      setPendingSelectId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.rentals.all });
      toast.show('지원자를 선택했어요. 대여가 확정되었습니다.', 'success');
    },
    onError: (error) => {
      setPendingSelectId(null);
      toast.show(
        error instanceof ApiError ? error.message : '선택하지 못했어요.',
        'error',
      );
    },
  });

  return (
    <>
      <PageTitle
        title="지원자 목록"
        description="신뢰도와 메시지를 확인하고 한 명을 선택하면 대여가 확정돼요."
      />

      {offers.isPending ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : offers.isError ? (
        <ErrorState error={offers.error} onRetry={() => offers.refetch()} />
      ) : offers.data.length ? (
        <ul className="grid max-w-2xl gap-3">
          {offers.data.map((offer) => (
            <li key={offer.id} className="rounded-card border border-ink-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {offer.offerer.nickname[0]}
                </div>

                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900">
                      {offer.offerer.nickname}
                    </span>
                    <TrustScoreBadge score={offer.offerer.trust_score} />
                    <StatusBadge kind="offer" status={offer.status} />
                  </div>

                  {offer.message && (
                    <p className="mt-2 text-sm text-ink-600">{offer.message}</p>
                  )}

                  <p className="mt-1.5 text-xs text-ink-400">
                    {formatRelative(offer.created_at)}
                  </p>
                </div>
              </div>

              {offer.status === OFFER_STATUS.PENDING && (
                <Button
                  size="sm"
                  className="mt-3"
                  fullWidth
                  onClick={() => setPendingSelectId(offer.id)}
                >
                  이 지원자 선택하기
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="아직 지원자가 없어요"
          description="'빌려줄게요' 지원이 들어오면 여기에 표시됩니다."
        />
      )}

      <ConfirmDialog
        open={pendingSelectId !== null}
        onClose={() => setPendingSelectId(null)}
        onConfirm={() => pendingSelectId && select.mutate(pendingSelectId)}
        loading={select.isPending}
        title="이 지원자를 선택할까요?"
        description="선택하면 대여가 확정되고 다른 지원은 자동 마감됩니다."
        confirmLabel="선택하기"
      />
    </>
  );
}
