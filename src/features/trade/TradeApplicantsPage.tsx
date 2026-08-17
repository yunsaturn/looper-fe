import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { tradeApi } from '@/entities/trade/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ApiError } from '@/shared/api/errors';
import { APPLICATION_STATUS } from '@/shared/config/status';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/Sheet';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { TrustScoreBadge } from '@/shared/ui/TrustScoreBadge';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/Toast';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 신청자 목록 (작성자 전용).
 * 한 명을 수락하면 나머지는 서버가 자동으로 마감한다.
 */
export function TradeApplicantsPage() {
  const { tradeId = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);

  const applications = useQuery({
    queryKey: queryKeys.trades.applications(tradeId),
    queryFn: () => tradeApi.applications(tradeId),
    enabled: Boolean(tradeId),
  });

  const accept = useMutation({
    mutationFn: (applicationId: string) =>
      tradeApi.acceptApplication(tradeId, applicationId),
    onSuccess: () => {
      setPendingAcceptId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
      toast.show(
        '신청을 수락했어요. 다른 신청자는 자동으로 마감됩니다.',
        'success',
      );
    },
    onError: (error) => {
      setPendingAcceptId(null);
      toast.show(
        error instanceof ApiError ? error.message : '수락하지 못했어요.',
        'error',
      );
    },
  });

  return (
    <>
      <PageTitle
        title="신청자 목록"
        description="한 명을 수락하면 나머지 신청은 자동으로 마감돼요."
      />

      {applications.isPending ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : applications.isError ? (
        <ErrorState
          error={applications.error}
          onRetry={() => applications.refetch()}
        />
      ) : applications.data.length ? (
        <ul className="grid max-w-2xl gap-3">
          {applications.data.map((application) => (
            <li
              key={application.id}
              className="rounded-card border border-ink-200 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {application.applicant.nickname[0]}
                </div>

                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900">
                      {application.applicant.nickname}
                    </span>
                    <TrustScoreBadge
                      score={application.applicant.trust_score}
                    />
                    <StatusBadge
                      kind="application"
                      status={application.status}
                    />
                  </div>

                  {application.message && (
                    <p className="mt-2 text-sm text-ink-600">
                      {application.message}
                    </p>
                  )}

                  <p className="mt-1.5 text-xs text-ink-400">
                    {formatRelative(application.created_at)}
                  </p>
                </div>
              </div>

              {application.status === APPLICATION_STATUS.PENDING && (
                <Button
                  size="sm"
                  className="mt-3"
                  fullWidth
                  onClick={() => setPendingAcceptId(application.id)}
                >
                  이 신청자 수락하기
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="아직 신청자가 없어요"
          description="신청이 들어오면 여기에 표시됩니다."
        />
      )}

      <ConfirmDialog
        open={pendingAcceptId !== null}
        onClose={() => setPendingAcceptId(null)}
        onConfirm={() => pendingAcceptId && accept.mutate(pendingAcceptId)}
        loading={accept.isPending}
        title="이 신청자를 수락할까요?"
        description="수락하면 게시물이 예약 중으로 바뀌고 다른 신청자는 자동 마감됩니다. 확정 후 취소는 신뢰도에 반영돼요."
        confirmLabel="수락하기"
      />
    </>
  );
}
