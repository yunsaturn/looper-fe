import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { rentalApi } from '@/entities/rental/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ApiError } from '@/shared/api/errors';
import { CATEGORY_LABEL } from '@/shared/config/categories';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import {
  OFFER_STATUS_META,
  RENTAL_STATUS,
  RENTAL_STATUS_META,
} from '@/shared/config/status';
import { useAuthStore } from '@/shared/store/authStore';
import {
  formatDateTime,
  formatDuration,
  formatPrice,
  formatRemaining,
  formatTime,
} from '@/shared/lib/format';
import { CARBON_DISCLAIMER, formatCarbon } from '@/shared/lib/carbon';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Field';
import { ConfirmDialog, Sheet } from '@/shared/ui/Sheet';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { TrustScoreBadge } from '@/shared/ui/TrustScoreBadge';
import { ErrorState, Skeleton } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/useToast';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 대여 요청 상세.
 *
 * 방향이 뒤집힌 구조라 화면 주체가 둘이다.
 *   요청자 — 지원자 목록 확인 → 선택 → 수령 확인 → 반납 요청
 *   지원자 — '제가 빌려줄게요' 지원 → 반납 확인
 * 어떤 버튼을 보여줄지는 서버가 준 status·can_offer 로만 판단한다.
 */
export function RentalDetailPage() {
  const { rentalId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const myId = useAuthStore((s) => s.userId);

  const [offerOpen, setOfferOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<
    'pickup' | 'return-request' | 'return-confirm' | 'cancel' | null
  >(null);

  const rental = useQuery({
    queryKey: queryKeys.rentals.detail(rentalId),
    queryFn: () => rentalApi.detail(rentalId),
    enabled: Boolean(rentalId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.rentals.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.impact.all });
  };

  const onMutationError = (error: unknown) => {
    const apiError = error instanceof ApiError ? error : null;
    toast.show(
      apiError
        ? apiError.currentStatus
          ? `${apiError.message} (현재: ${statusLabel(apiError.currentStatus)})`
          : apiError.message
        : '요청을 처리하지 못했어요.',
      'error',
    );
  };

  const offer = useMutation({
    mutationFn: () => rentalApi.offer(rentalId, message),
    onSuccess: () => {
      setOfferOpen(false);
      setMessage('');
      invalidate();
      toast.show('지원했어요. 요청자의 선택을 기다려주세요.', 'success');
    },
    onError: onMutationError,
  });

  const step = useMutation({
    mutationFn: (
      action: 'pickup' | 'return-request' | 'return-confirm' | 'cancel',
    ) => {
      if (action === 'pickup') return rentalApi.confirmPickup(rentalId);
      if (action === 'return-request') return rentalApi.requestReturn(rentalId);
      if (action === 'return-confirm') return rentalApi.confirmReturn(rentalId);
      return rentalApi.cancel(rentalId);
    },
    onSuccess: (_data, action) => {
      setConfirmAction(null);
      invalidate();
      if (action === 'return-confirm') {
        navigate(buildPath(ROUTES.RENTAL_COMPLETE, { rentalId }));
        return;
      }
      toast.show(STEP_MESSAGE[action], 'success');
    },
    onError: (error) => {
      setConfirmAction(null);
      onMutationError(error);
    },
  });

  if (rental.isPending) {
    return (
      <div className="grid max-w-2xl gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (rental.isError) {
    return <ErrorState error={rental.error} onRetry={() => rental.refetch()} />;
  }

  const data = rental.data;
  const isRequester = data.requester.id === myId;
  const meta = RENTAL_STATUS_META[data.status];
  const remaining = formatRemaining(data.due_at);

  return (
    <>
      <PageTitle title="대여 요청 상세" />

      <div className="grid max-w-2xl gap-4">
        <section className="rounded-card border border-ink-200 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge
              kind="rental"
              status={data.status}
              isOverdue={data.is_overdue}
            />
            <span className="rounded-chip bg-ink-50 px-2 py-0.5 text-xs text-ink-500">
              {CATEGORY_LABEL[data.category]}
            </span>
          </div>

          <h2 className="mt-3 text-xl font-bold text-ink-900">
            {data.item_name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink-600">
            {data.description}
          </p>
        </section>

        <section className="rounded-card border border-ink-200 p-4">
          <h3 className="text-sm font-bold text-ink-900">대여 조건</h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="시작 시간" value={formatDateTime(data.start_at)} />
            <Row
              label="반납 예정"
              value={`${formatTime(data.due_at)} · ${remaining.text}`}
            />
            <Row label="희망 장소" value={data.pickup_zone.name} />
            <Row label="사용료" value={formatPrice(data.offered_price)} />
            {data.status === RENTAL_STATUS.RECRUITING && (
              <Row label="지원자" value={`${data.offer_count}명`} />
            )}
            {data.remaining_minutes != null && (
              <Row
                label="남은 시간"
                value={formatDuration(Math.max(0, data.remaining_minutes))}
              />
            )}
          </dl>

          {data.is_overdue && (
            <p className="mt-3 rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
              반납 예정 시간이 지났어요. 지연은 신뢰도에 반영돼요.
            </p>
          )}
        </section>

        {/* 확정된 제공자 — 선택 전에는 응답에서 빠진다 */}
        {data.selected_offerer && (
          <section className="rounded-card border border-brand-300 bg-brand-100 p-4">
            <h3 className="text-sm font-bold text-brand-800">빌려주는 학생</h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-700">
                {data.selected_offerer.nickname[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {data.selected_offerer.nickname}
                </p>
                <p className="mt-0.5 text-xs text-ink-600">
                  신뢰도 {data.selected_offerer.trust_score} · 대여 완료{' '}
                  {data.selected_offerer.rental_completed_count}건
                </p>
              </div>
            </div>
            {data.return_message && (
              <p className="mt-3 rounded-btn bg-white/70 px-3 py-2 text-sm text-ink-700">
                {data.return_message}
              </p>
            )}
          </section>
        )}

        {/* 완료된 대여의 기록된 임팩트 */}
        {data.impact && (
          <section className="rounded-card border border-ink-200 p-4">
            <h3 className="text-sm font-bold text-ink-900">이 대여의 성과</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div>
                <dt className="text-xs text-ink-500">줄인 폐기물</dt>
                <dd className="mt-0.5 text-sm font-bold text-ink-900 tabular-nums">
                  {data.impact.waste_reduced_kg}kg
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">예상 탄소</dt>
                <dd className="mt-0.5 text-sm font-bold text-ink-900 tabular-nums">
                  {formatCarbon(data.impact.estimated_carbon_saved_kg_co2e)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-ink-400">
              {CARBON_DISCLAIMER} · 대여는 절약 금액을 0원으로 계산해요.
            </p>
          </section>
        )}

        <section className="rounded-card border border-ink-200 p-4">
          <h3 className="text-sm font-bold text-ink-900">요청자</h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {data.requester.nickname[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {data.requester.nickname}
              </p>
              <TrustScoreBadge score={data.requester.trust_score} />
            </div>
          </div>
        </section>

        <section className="rounded-card border border-ink-200 p-4">
          <p className="text-sm text-ink-600">{meta.description}</p>

          {data.my_offer_status && (
            <p className="mt-2 text-sm text-ink-500">
              내 지원 상태:{' '}
              <span className="font-semibold text-ink-800">
                {OFFER_STATUS_META[data.my_offer_status].label}
              </span>
            </p>
          )}

          <div className="mt-4 grid gap-2">
            {isRequester && data.status === RENTAL_STATUS.RECRUITING && (
              <>
                <Button
                  fullWidth
                  onClick={() =>
                    navigate(
                      buildPath(ROUTES.RENTAL_OFFERS, { rentalId: data.id }),
                    )
                  }
                >
                  지원자 목록 보기
                </Button>
                {/* 모집 중일 때만 수정할 수 있다. 서버 규칙과 같다 */}
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() =>
                    navigate(
                      buildPath(ROUTES.RENTAL_EDIT, { rentalId: data.id }),
                    )
                  }
                >
                  요청 수정
                </Button>
              </>
            )}

            {!isRequester && data.can_offer && (
              <Button fullWidth onClick={() => setOfferOpen(true)}>
                제가 빌려줄게요
              </Button>
            )}

            {isRequester && data.status === RENTAL_STATUS.CONFIRMED && (
              <Button fullWidth onClick={() => setConfirmAction('pickup')}>
                물품 수령했어요
              </Button>
            )}

            {isRequester && data.status === RENTAL_STATUS.IN_USE && (
              <Button
                fullWidth
                onClick={() => setConfirmAction('return-request')}
              >
                반납했어요
              </Button>
            )}

            {!isRequester && data.status === RENTAL_STATUS.RETURN_PENDING && (
              <Button
                fullWidth
                onClick={() => setConfirmAction('return-confirm')}
              >
                반납 확인했어요
              </Button>
            )}

            {(data.status === RENTAL_STATUS.RECRUITING ||
              data.status === RENTAL_STATUS.CONFIRMED) && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setConfirmAction('cancel')}
              >
                대여 취소
              </Button>
            )}
          </div>
        </section>
      </div>

      <Sheet
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        title="빌려주기 지원"
        footer={
          <Button
            fullWidth
            loading={offer.isPending}
            onClick={() => offer.mutate()}
          >
            지원 보내기
          </Button>
        }
      >
        <div className="grid gap-3">
          <p className="text-sm text-ink-600">
            {formatDateTime(data.start_at)} · {data.pickup_zone.name} 에서
            전달하면 돼요.
          </p>
          <Textarea
            label="요청자에게 전할 말 (선택)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예: 지금 중앙도서관에 있어서 바로 드릴 수 있어요."
          />
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmAction === 'pickup'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => step.mutate('pickup')}
        loading={step.isPending}
        title="물품을 수령했나요?"
        description="확인하면 대여 중으로 바뀌고 반납 예정 시간 카운트가 시작돼요."
        confirmLabel="수령 확인"
      />

      <ConfirmDialog
        open={confirmAction === 'return-request'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => step.mutate('return-request')}
        loading={step.isPending}
        title="반납했나요?"
        description="빌려준 학생이 확인하면 반납이 완료됩니다."
        confirmLabel="반납 완료 요청"
      />

      <ConfirmDialog
        open={confirmAction === 'return-confirm'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => step.mutate('return-confirm')}
        loading={step.isPending}
        title="반납을 확인할까요?"
        description="확인하면 반납이 완료되고 양측 신뢰도와 예상 탄소 절감량이 반영됩니다."
        confirmLabel="반납 확인"
      />

      <ConfirmDialog
        open={confirmAction === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => step.mutate('cancel')}
        loading={step.isPending}
        title="대여를 취소할까요?"
        description="물품 수령 전까지만 취소할 수 있어요. 확정 후 취소는 신뢰도에 반영돼요."
        confirmLabel="대여 취소"
        confirmVariant="danger"
      />
    </>
  );
}

const STEP_MESSAGE: Record<string, string> = {
  pickup: '수령을 확인했어요. 반납 예정 시간을 지켜주세요.',
  'return-request': '반납 요청을 보냈어요.',
  'return-confirm': '반납이 완료되었어요.',
  cancel: '대여를 취소했어요.',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-ink-400">{label}</dt>
      <dd className="text-ink-800">{value}</dd>
    </div>
  );
}

function statusLabel(code: string): string {
  return (
    RENTAL_STATUS_META[code as keyof typeof RENTAL_STATUS_META]?.label ?? code
  );
}
