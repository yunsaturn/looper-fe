import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { tradeApi } from '@/entities/trade/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ApiError } from '@/shared/api/errors';
import {
  CATEGORY_LABEL,
  ITEM_CONDITION_LABEL,
  TRADE_TYPE_LABEL,
} from '@/shared/config/categories';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_META,
  TRADE_STATUS,
  TRADE_STATUS_META,
} from '@/shared/config/status';
import { useAuthStore } from '@/shared/store/authStore';
import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatPrice,
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
 * 거래 게시물 상세.
 *
 * 데스크톱은 2단(이미지 좌 / 정보 우), 모바일은 세로 스택.
 * 버튼 노출은 서버가 내려준 `can_apply`·`status` 를 그대로 따른다 —
 * 프론트에서 조건을 재계산하면 서버와 판단이 어긋난다. (R5)
 */
export function TradeDetailPage() {
  const { tradeId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const myId = useAuthStore((s) => s.userId);

  const [applyOpen, setApplyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<
    | 'complete-request'
    | 'complete-confirm'
    | 'cancel-reservation'
    | 'cancel-application'
    | null
  >(null);

  const trade = useQuery({
    queryKey: queryKeys.trades.detail(tradeId),
    queryFn: () => tradeApi.detail(tradeId),
    enabled: Boolean(tradeId),
  });

  /**
   * 게시물 삭제.
   *
   * 삭제하면 이 화면의 대상이 사라지므로 상세를 재조회하지 않고 목록으로
   * 빠져나간다. 남아 있으면 곧바로 404 를 받는다.
   */
  const remove = useMutation({
    mutationFn: () => tradeApi.remove(tradeId),
    onSuccess: () => {
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
      toast.show('게시물을 삭제했어요.', 'success');
      navigate(ROUTES.TRADE_LIST, { replace: true });
    },
    onError: (error) => {
      setDeleteOpen(false);
      const apiError = error instanceof ApiError ? error : null;
      // 아직 서버에 삭제 API 가 없는 경우와 진짜 실패를 구분해 알린다
      toast.show(
        apiError?.isNotImplemented
          ? '아직 서버에 삭제 기능이 준비되지 않았어요.'
          : (apiError?.message ?? '삭제하지 못했어요.'),
        'error',
      );
    },
  });

  /** 상태를 바꾸는 요청은 전부 성공 후 재조회한다. 낙관적 업데이트는 쓰지 않는다. */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
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

  /** 대기 중인 내 신청 취소. 수락된 뒤에는 예약 취소로 넘어간다 */
  const cancelApplication = useMutation({
    mutationFn: () =>
      tradeApi.cancelApplication(tradeId, data?.my_application_id ?? ''),
    onSuccess: () => {
      setConfirmAction(null);
      invalidate();
      toast.show('신청을 취소했어요.', 'success');
    },
    onError: onMutationError,
  });

  const apply = useMutation({
    mutationFn: () => tradeApi.apply(tradeId, message),
    onSuccess: () => {
      setApplyOpen(false);
      setMessage('');
      invalidate();
      toast.show('거래를 신청했어요. 작성자의 수락을 기다려주세요.', 'success');
    },
    onError: onMutationError,
  });

  const requestCompletion = useMutation({
    mutationFn: () => tradeApi.requestCompletion(tradeId),
    onSuccess: () => {
      setConfirmAction(null);
      invalidate();
      toast.show(
        '완료 요청을 보냈어요. 상대방 확인을 기다려주세요.',
        'success',
      );
    },
    onError: onMutationError,
  });

  const confirmCompletion = useMutation({
    mutationFn: () => tradeApi.confirmCompletion(tradeId),
    onSuccess: () => {
      setConfirmAction(null);
      invalidate();
      navigate(buildPath(ROUTES.TRADE_COMPLETE, { tradeId }));
    },
    onError: onMutationError,
  });

  const cancelReservation = useMutation({
    mutationFn: () => tradeApi.cancelReservation(tradeId),
    onSuccess: () => {
      setConfirmAction(null);
      invalidate();
      toast.show('예약을 취소했어요. 다시 거래 가능 상태가 됩니다.', 'info');
    },
    onError: onMutationError,
  });

  if (trade.isPending) return <DetailSkeleton />;
  if (trade.isError)
    return <ErrorState error={trade.error} onRetry={() => trade.refetch()} />;

  const data = trade.data;
  const isAuthor = data.author.id === myId;
  /*
   * 예약 이후의 버튼(완료 요청·확인, 예약 취소)은 **당사자만** 볼 수 있어야
   * 한다. 예전에는 상태만 보고 그려서 지나가던 사람에게도 '예약 취소'가
   * 보였다. 눌러도 서버가 403 을 주지만, 애초에 남의 거래를 취소할 수 있는
   * 것처럼 보이는 화면이 잘못이다.
   */
  const isParticipant = isAuthor || data.counterparty?.id === myId;
  const meta = TRADE_STATUS_META[data.status];

  return (
    <>
      <PageTitle title="게시물 상세" />

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {/* 좌: 이미지 + 작성자 */}
        <div className="grid gap-4">
          <div className="aspect-4/3 overflow-hidden rounded-card bg-ink-50">
            {data.image_urls[0] ? (
              <img
                src={data.image_urls[0]}
                alt={data.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-300">
                등록된 이미지가 없어요
              </div>
            )}
          </div>

          <section className="rounded-card border border-ink-200 p-4">
            <h2 className="text-sm font-bold text-ink-900">작성자 정보</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {data.author.nickname[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {data.author.nickname}
                </p>
                <TrustScoreBadge score={data.author.trust_score} />
              </div>
              <Link
                to={buildPath(ROUTES.USER_PROFILE, { userId: data.author.id })}
                className="ml-auto text-sm text-ink-500 underline hover:text-brand-700"
              >
                프로필 보기
              </Link>
            </div>
          </section>
        </div>

        {/* 우: 정보 + 액션 */}
        <div className="grid gap-4">
          <section className="rounded-card border border-ink-200 p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-chip bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-600">
                {TRADE_TYPE_LABEL[data.trade_type]}
              </span>
              <span className="rounded-chip bg-ink-50 px-2 py-0.5 text-xs text-ink-500">
                {CATEGORY_LABEL[data.category]}
              </span>
              <StatusBadge
                kind="trade"
                status={data.status}
                availableDate={data.available_date}
              />
            </div>

            <h2 className="mt-3 text-xl font-bold text-ink-900">
              {data.title}
            </h2>
            <p className="mt-1 text-lg font-bold text-ink-900">
              {formatPrice(data.price)}
            </p>

            <h3 className="mt-4 text-sm font-bold text-ink-900">설명</h3>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-ink-600">
              {data.description}
            </p>
          </section>

          <section className="rounded-card border border-ink-200 p-4">
            <h3 className="text-sm font-bold text-ink-900">거래 조건</h3>
            <dl className="mt-3 grid gap-2 text-sm">
              <Row label="거래 방식" value="직거래 (픽업존 수령)" />
              <Row
                label="거래 가능 날짜"
                value={formatDate(data.available_date)}
              />
              <Row label="픽업존" value={data.pickup_zone.name} />
              <Row
                label="상품 상태"
                value={ITEM_CONDITION_LABEL[data.condition]}
              />
              {data.weight_kg != null && (
                <Row label="무게" value={`${data.weight_kg}kg`} />
              )}
            </dl>
          </section>

          {/*
            확정된 거래 약속. 수락 시점에 정해지므로 예약 이후에만 온다.
            약속을 못 보면 언제 어디서 만나는지 알 방법이 없어서 상세에서
            가장 먼저 눈에 띄어야 하는 정보다.
          */}
          {data.meeting && (
            <section className="rounded-card border border-brand-300 bg-brand-100 p-4">
              <h3 className="text-sm font-bold text-brand-800">거래 약속</h3>
              <dl className="mt-3 grid gap-2 text-sm">
                <Row
                  label="만나는 시각"
                  value={formatDateTime(data.meeting.meeting_at)}
                />
                <Row label="장소" value={data.meeting.pickup_zone.name} />
                {data.counterparty && (
                  <Row
                    label="상대방"
                    value={`${data.counterparty.nickname} · 신뢰도 ${data.counterparty.trust_score}`}
                  />
                )}
              </dl>
              {data.meeting.message && (
                <p className="mt-3 rounded-btn bg-white/70 px-3 py-2 text-sm text-ink-700">
                  {data.meeting.message}
                </p>
              )}
            </section>
          )}

          {/* 완료된 거래는 그때 기록된 임팩트를 그대로 보여준다 */}
          {data.impact && (
            <section className="rounded-card border border-ink-200 p-4">
              <h3 className="text-sm font-bold text-ink-900">이 거래의 성과</h3>
              <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
                <ImpactCell
                  label="절약 금액"
                  value={formatAmount(data.impact.saved_amount)}
                />
                <ImpactCell
                  label="줄인 폐기물"
                  value={`${data.impact.waste_reduced_kg}kg`}
                />
                <ImpactCell
                  label="예상 탄소"
                  value={formatCarbon(
                    data.impact.estimated_carbon_saved_kg_co2e,
                  )}
                />
              </dl>
              <p className="mt-3 text-[11px] text-ink-400">
                {CARBON_DISCLAIMER} · {formatDateTime(data.impact.completed_at)}{' '}
                완료
              </p>
              <Link
                to={buildPath(ROUTES.IMPACT_ACTIVITY, {
                  activityId: data.impact.activity_id,
                })}
                className="mt-2 inline-block text-xs font-semibold text-brand-700 underline"
              >
                이 숫자는 어떻게 나왔나요?
              </Link>
            </section>
          )}

          {/* 액션 — 상태와 역할에 따라 달라진다 */}
          <section className="rounded-card border border-ink-200 p-4">
            <p className="text-sm text-ink-600">{meta.description}</p>

            {data.my_application_status && (
              <p className="mt-2 text-sm text-ink-500">
                내 신청 상태:{' '}
                <span className="font-semibold text-ink-800">
                  {APPLICATION_STATUS_META[data.my_application_status].label}
                </span>
              </p>
            )}

            <div className="mt-4 grid gap-2">
              {isAuthor && data.status === TRADE_STATUS.AVAILABLE && (
                <>
                  <Button
                    fullWidth
                    onClick={() =>
                      navigate(
                        buildPath(ROUTES.TRADE_APPLICANTS, {
                          tradeId: data.id,
                        }),
                      )
                    }
                  >
                    신청자 목록 보기
                  </Button>
                  {/* 수정·삭제는 거래 가능 상태에서만 열어둔다. 서버 규칙과 같다 */}
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() =>
                      navigate(
                        buildPath(ROUTES.TRADE_EDIT, { tradeId: data.id }),
                      )
                    }
                  >
                    게시물 수정
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => setDeleteOpen(true)}
                  >
                    게시물 삭제
                  </Button>
                </>
              )}

              {!isAuthor && data.can_apply && (
                <Button fullWidth onClick={() => setApplyOpen(true)}>
                  거래 신청하기
                </Button>
              )}

              {isParticipant && data.status === TRADE_STATUS.RESERVED && (
                <>
                  <Button
                    fullWidth
                    onClick={() => setConfirmAction('complete-request')}
                  >
                    거래 완료 요청
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setConfirmAction('cancel-reservation')}
                  >
                    예약 취소
                  </Button>
                </>
              )}

              {isParticipant &&
                data.status === TRADE_STATUS.COMPLETION_PENDING && (
                  <Button
                    fullWidth
                    onClick={() => setConfirmAction('complete-confirm')}
                  >
                    거래 완료 확인
                  </Button>
                )}

              {/* 신청 취소 — 아직 수락되지 않은 내 신청만 거둬들일 수 있다 */}
              {!isAuthor &&
                data.my_application_id &&
                data.my_application_status === APPLICATION_STATUS.PENDING && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setConfirmAction('cancel-application')}
                  >
                    신청 취소
                  </Button>
                )}
            </div>

            {!isAuthor && !data.can_apply && !data.my_application_status && (
              <p className="mt-3 text-xs text-ink-400">
                지금은 신청할 수 없는 게시물이에요.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* 거래 신청 시트 */}
      <Sheet
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="거래 신청하기"
        footer={
          <Button
            fullWidth
            loading={apply.isPending}
            onClick={() => apply.mutate()}
          >
            신청 보내기
          </Button>
        }
      >
        <div className="grid gap-3">
          <p className="text-sm text-ink-600">
            {formatDate(data.available_date)} · {data.pickup_zone.name} 에서
            만나요.
          </p>
          <Textarea
            label="작성자에게 전할 말 (선택)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예: 오후 3시 이후에 픽업 가능합니다."
          />
        </div>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title="게시물을 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요. 신청자가 있었다면 더 이상 이 글을 볼 수 없게 됩니다."
        confirmLabel="삭제하기"
      />

      <ConfirmDialog
        open={confirmAction === 'cancel-application'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => cancelApplication.mutate()}
        loading={cancelApplication.isPending}
        title="신청을 취소할까요?"
        description="취소하면 작성자의 신청자 목록에서 사라져요. 다시 신청할 수 있습니다."
        confirmLabel="신청 취소"
      />

      <ConfirmDialog
        open={confirmAction === 'complete-request'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => requestCompletion.mutate()}
        loading={requestCompletion.isPending}
        title="거래 완료를 요청할까요?"
        description="상대방이 확인하면 거래가 완료됩니다. 완료된 거래는 되돌릴 수 없어요."
        confirmLabel="완료 요청"
      />

      <ConfirmDialog
        open={confirmAction === 'complete-confirm'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmCompletion.mutate()}
        loading={confirmCompletion.isPending}
        title="거래를 완료할까요?"
        description="확인하면 거래가 완료되고 예상 탄소 절감량이 반영됩니다. 완료된 거래는 되돌릴 수 없어요."
        confirmLabel="거래 완료"
      />

      <ConfirmDialog
        open={confirmAction === 'cancel-reservation'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => cancelReservation.mutate()}
        loading={cancelReservation.isPending}
        title="예약을 취소할까요?"
        description="게시물이 다시 거래 가능 상태로 돌아가고, 기존 신청은 모두 취소됩니다. 확정 후 취소는 신뢰도에 반영돼요."
        confirmLabel="예약 취소"
        confirmVariant="danger"
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-ink-400">{label}</dt>
      <dd className="text-ink-800">{value}</dd>
    </div>
  );
}

/** 서버가 내려준 원시 상태 코드를 한글 라벨로. 없으면 코드를 그대로 보여준다. */
function statusLabel(code: string): string {
  return (
    TRADE_STATUS_META[code as keyof typeof TRADE_STATUS_META]?.label ?? code
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Skeleton className="aspect-4/3 w-full" />
      <div className="grid gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}

function ImpactCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold text-ink-900 tabular-nums">
        {value}
      </dd>
    </div>
  );
}
