import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { rentalApi } from '@/entities/rental/api';
import type { RentalDetail } from '@/entities/rental/types';
import { ApiError } from '@/shared/api/errors';
import { queryKeys } from '@/shared/api/queryKeys';
import { RENTAL_DURATION_OPTIONS } from '@/shared/config/rental';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import { RENTAL_STATUS } from '@/shared/config/status';
import {
  formatDateTime,
  formatDuration,
  toLocalInputValue,
} from '@/shared/lib/format';
import { useAuthStore } from '@/shared/store/authStore';
import { Button } from '@/shared/ui/Button';
import { Input, Select, Textarea } from '@/shared/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/useToast';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 대여 요청 수정.
 *
 * 서버가 열어둔 항목은 설명·시작 시각·사용 시간·사용료 넷이다. 물품명과
 * 카테고리, 픽업존은 지원자가 그 조건을 보고 지원했으므로 바꿀 수 없다.
 *
 * 시작 시각이나 사용 시간을 바꾸면 **반납 예정 시각을 서버가 다시 계산**한다.
 * 화면에서는 미리보기만 보여주고, 확정 값은 응답의 due_at 을 따른다.
 *
 * 수정은 지원자 모집 중(RECRUITING)일 때만 가능하다.
 */
export function RentalEditPage() {
  const { rentalId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const myId = useAuthStore((s) => s.userId);

  const rental = useQuery({
    queryKey: queryKeys.rentals.detail(rentalId),
    queryFn: () => rentalApi.detail(rentalId),
    enabled: Boolean(rentalId),
  });

  if (rental.isPending) {
    return (
      <div className="grid max-w-2xl gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (rental.isError) {
    return <ErrorState error={rental.error} onRetry={() => rental.refetch()} />;
  }

  const data = rental.data;

  if (data.requester.id !== myId) {
    return (
      <EmptyState
        title="수정할 수 없는 요청이에요"
        description="본인이 올린 대여 요청만 수정할 수 있어요."
      />
    );
  }

  if (data.status !== RENTAL_STATUS.RECRUITING) {
    return (
      <EmptyState
        title="지금은 수정할 수 없어요"
        description="지원자를 선택해 대여가 확정된 뒤에는 조건을 바꿀 수 없어요."
      />
    );
  }

  return (
    <RentalEditForm
      rental={data}
      onSaved={() => {
        toast.show('대여 요청을 수정했어요.', 'success');
        void queryClient.invalidateQueries({ queryKey: queryKeys.rentals.all });
        navigate(buildPath(ROUTES.RENTAL_DETAIL, { rentalId }), {
          replace: true,
        });
      }}
      onCancel={() => navigate(-1)}
    />
  );
}

function RentalEditForm({
  rental,
  onSaved,
  onCancel,
}: {
  rental: RentalDetail;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState(rental.description);
  const [startAt, setStartAt] = useState(
    toLocalInputValue(new Date(rental.start_at)),
  );
  const [durationMinutes, setDurationMinutes] = useState(() =>
    Math.max(
      1,
      Math.round(
        (new Date(rental.due_at).getTime() -
          new Date(rental.start_at).getTime()) /
          60_000,
      ),
    ),
  );
  const [price, setPrice] = useState(String(rental.offered_price ?? 0));

  const save = useMutation({
    mutationFn: () =>
      rentalApi.update(rental.id, {
        description,
        start_at: new Date(startAt).toISOString(),
        duration_minutes: durationMinutes,
        offered_price: Number(price || 0),
      }),
    onSuccess: onSaved,
  });

  const error = save.error instanceof ApiError ? save.error : null;

  const dueAtPreview = startAt
    ? new Date(new Date(startAt).getTime() + durationMinutes * 60_000)
    : null;

  /*
   * 기존 사용 시간이 선택지에 없을 수 있다(서버는 1~10080분 아무 값이나 받고,
   * 다른 화면에서 만들어졌을 수도 있다). 그대로 두면 select 가 첫 항목으로
   * 튀면서 사용자가 건드리지 않은 값이 조용히 바뀐다. 그래서 현재 값을
   * 목록에 끼워 넣는다.
   */
  const durationChoices = RENTAL_DURATION_OPTIONS.includes(
    durationMinutes as (typeof RENTAL_DURATION_OPTIONS)[number],
  )
    ? [...RENTAL_DURATION_OPTIONS]
    : [...RENTAL_DURATION_OPTIONS, durationMinutes].sort((a, b) => a - b);

  return (
    <>
      <PageTitle
        title="대여 요청 수정"
        description="지원자를 모집하는 동안에만 수정할 수 있어요."
      />

      <form
        className="grid max-w-2xl gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Textarea
          label="내용"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={3000}
          required
          error={error?.fieldError('description')}
        />

        <Input
          label="시작 시각"
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          required
          error={error?.fieldError('start_at')}
        />

        <Select
          label="사용 시간"
          value={String(durationMinutes)}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          options={durationChoices.map((m) => ({
            value: String(m),
            label: formatDuration(m),
          }))}
          required
          error={error?.fieldError('duration_minutes')}
        />

        {dueAtPreview && (
          <p className="rounded-btn bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
            반납 예정 시간은{' '}
            <strong>{formatDateTime(dueAtPreview.toISOString())}</strong> 로
            바뀌어요. 확정 값은 저장할 때 서버가 다시 계산합니다.
          </p>
        )}

        <Input
          label="사용료"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          hint="0원이면 무료로 표시돼요."
          error={error?.fieldError('offered_price')}
        />

        <p className="rounded-card bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          물품명·카테고리·희망 장소는 수정할 수 없어요. 이미 지원한 학생이 그
          조건을 보고 지원했기 때문이에요.
        </p>

        {error && (
          <div className="rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
            <p>{error.message}</p>
            {error
              .unshownFieldErrors([
                'description',
                'start_at',
                'duration_minutes',
                'offered_price',
              ])
              .map((fe) => (
                <p key={fe.field} className="mt-1 text-xs">
                  {fe.field}: {fe.message}
                </p>
              ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onCancel}
          >
            취소
          </Button>
          <Button type="submit" fullWidth loading={save.isPending}>
            저장하기
          </Button>
        </div>
      </form>
    </>
  );
}
