import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { metaApi } from '@/entities/meta/api';
import { tradeApi } from '@/entities/trade/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ApiError } from '@/shared/api/errors';
import { APPLICATION_STATUS } from '@/shared/config/status';
import { formatRelative, toLocalInputValue } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Input, Select, Textarea } from '@/shared/ui/Field';
import { Sheet } from '@/shared/ui/Sheet';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { TrustScoreBadge } from '@/shared/ui/TrustScoreBadge';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/feedback';
import { useAuthStore } from '@/shared/store/authStore';
import { useToast } from '@/shared/ui/useToast';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 신청자 목록 (작성자 전용).
 *
 * 한 명을 수락하면 나머지는 서버가 자동으로 마감한다.
 *
 * ⚠️ 수락은 **거래 약속 확정과 한 번에** 일어난다. 서버가 만날 시각·픽업존을
 *    필수 본문으로 받으므로(`@NotNull @Future`), 확인 한 번으로는 수락할 수
 *    없고 약속을 입력받아야 한다. 그래서 확인 다이얼로그 대신 폼을 띄운다.
 */
export function TradeApplicantsPage() {
  const { tradeId = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);
  const campusId = useAuthStore((s) => s.campusId);

  const zones = useQuery({
    queryKey: queryKeys.pickupZones(campusId ?? ''),
    queryFn: () => metaApi.pickupZones(campusId!),
    enabled: Boolean(campusId),
  });

  const applications = useQuery({
    queryKey: queryKeys.trades.applications(tradeId),
    queryFn: () => tradeApi.applications(tradeId),
    enabled: Boolean(tradeId),
  });

  const accept = useMutation({
    mutationFn: ({
      applicationId,
      meetingAt,
      pickupZoneId,
      message,
    }: {
      applicationId: string;
      meetingAt: string;
      pickupZoneId: string;
      message: string;
    }) =>
      tradeApi.acceptApplication(tradeId, applicationId, {
        // <input type="datetime-local"> 은 타임존이 없는 문자열을 준다.
        // 서버는 Instant 를 기대하므로 브라우저 시간대 기준으로 변환한다.
        meeting_at: new Date(meetingAt).toISOString(),
        pickup_zone_id: pickupZoneId,
        message: message || undefined,
      }),
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

      <Sheet
        open={pendingAcceptId !== null}
        onClose={() => setPendingAcceptId(null)}
        title="거래 약속 정하기"
      >
        <MeetingForm
          zones={(zones.data ?? []).map((z) => ({
            value: z.id,
            label: z.name,
          }))}
          zonesLoading={zones.isPending}
          loading={accept.isPending}
          error={accept.error instanceof ApiError ? accept.error : null}
          onCancel={() => setPendingAcceptId(null)}
          onSubmit={(values) =>
            pendingAcceptId &&
            accept.mutate({ applicationId: pendingAcceptId, ...values })
          }
        />
      </Sheet>
    </>
  );
}

/** 수락과 함께 확정할 만날 시각·장소·메모 */
function MeetingForm({
  zones,
  zonesLoading,
  loading,
  error,
  onCancel,
  onSubmit,
}: {
  zones: { value: string; label: string }[];
  zonesLoading: boolean;
  loading: boolean;
  error: ApiError | null;
  onCancel: () => void;
  onSubmit: (values: {
    meetingAt: string;
    pickupZoneId: string;
    message: string;
  }) => void;
}) {
  const [meetingAt, setMeetingAt] = useState('');
  const [pickupZoneId, setPickupZoneId] = useState('');
  const [message, setMessage] = useState('');

  // 서버가 미래 시각만 받는다. 브라우저에서도 과거를 못 고르게 막아
  // 굳이 400 을 받고 오지 않게 한다.
  const minLocal = toLocalInputValue(new Date(Date.now() + 10 * 60_000));

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ meetingAt, pickupZoneId, message });
      }}
    >
      <p className="rounded-btn bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
        수락하면 게시물이 예약 중으로 바뀌고 다른 신청자는 자동 마감돼요. 확정
        후 취소는 신뢰도에 반영됩니다.
      </p>

      <Input
        label="만날 시각"
        type="datetime-local"
        value={meetingAt}
        min={minLocal}
        onChange={(e) => setMeetingAt(e.target.value)}
        required
        error={error?.fieldError('meeting_at')}
      />

      <Select
        label="픽업존"
        value={pickupZoneId}
        onChange={(e) => setPickupZoneId(e.target.value)}
        options={zones}
        placeholder={zonesLoading ? '불러오는 중...' : '픽업존을 선택하세요'}
        required
        error={error?.fieldError('pickup_zone_id')}
      />

      <Textarea
        label="메모"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="예: 정문 앞 벤치에서 만나요."
        hint="선택 사항이에요."
        error={error?.fieldError('message')}
      />

      {error && !error.fieldErrors.length && (
        <p className="rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
          {error.message}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          취소
        </Button>
        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={!meetingAt || !pickupZoneId}
        >
          수락하기
        </Button>
      </div>
    </form>
  );
}
