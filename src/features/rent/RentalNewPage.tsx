import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { metaApi } from '@/entities/meta/api';
import { rentalApi } from '@/entities/rental/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ApiError } from '@/shared/api/errors';
import {
  CATEGORY_FILTERS,
  CATEGORY_LABEL,
  type Category,
} from '@/shared/config/categories';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { formatDateTime, formatDuration } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Input, Select, Textarea } from '@/shared/ui/Field';
import { useToast } from '@/shared/ui/Toast';
import { PageTitle } from '@/app/layouts/StackLayout';

const DURATION_OPTIONS = [30, 60, 120, 180, 360, 720, 1440, 2880];

/** 로컬 시각을 datetime-local 입력값으로 (타임존 보정) */
function toLocalInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/**
 * 대여 요청 등록.
 *
 * 사용 시간을 고르면 반납 예정 시간이 자동 계산되어 미리 표시된다.
 * (확정 값은 서버가 start_at + duration 으로 계산해 내려준다)
 */
export function RentalNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const campusId = useAuthStore((s) => s.campusId);

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORY_FILTERS[0]);
  const [description, setDescription] = useState('');
  const [pickupZoneId, setPickupZoneId] = useState('');
  const [startAt, setStartAt] = useState(
    toLocalInputValue(new Date(Date.now() + 60 * 60_000)),
  );
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState('0');

  const zones = useQuery({
    queryKey: queryKeys.pickupZones(campusId ?? ''),
    queryFn: () => metaApi.pickupZones(campusId!),
    enabled: Boolean(campusId),
  });

  const create = useMutation({
    mutationFn: () =>
      rentalApi.create({
        item_name: itemName,
        category,
        description,
        pickup_zone_id: pickupZoneId,
        start_at: new Date(startAt).toISOString(),
        duration_minutes: durationMinutes,
        offered_price: Number(price || 0),
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rentals.all });
      toast.show('대여 요청을 등록했어요.', 'success');
      navigate(buildPath(ROUTES.RENTAL_DETAIL, { rentalId: created.id }), {
        replace: true,
      });
    },
    onError: (error) => {
      toast.show(
        error instanceof ApiError ? error.message : '등록에 실패했어요.',
        'error',
      );
    },
  });

  const error = create.error instanceof ApiError ? create.error : null;

  // 반납 예정 시간 미리보기
  const dueAtPreview = startAt
    ? new Date(new Date(startAt).getTime() + durationMinutes * 60_000)
    : null;

  return (
    <>
      <PageTitle
        title="대여 요청 등록"
        description="필요한 물건을 올리면 가진 학생이 '빌려줄게요'로 지원해요."
      />

      <form
        className="grid max-w-2xl gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Input
          label="물품명"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="예: 공학용 계산기"
          required
          error={error?.fieldError('item_name')}
        />

        <Select
          label="카테고리"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          options={CATEGORY_FILTERS.map((c) => ({
            value: c,
            label: CATEGORY_LABEL[c],
          }))}
          required
        />

        <Textarea
          label="요청 내용"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="예: 시험 직전 두 시간만 필요합니다."
          required
          error={error?.fieldError('description')}
        />

        <Select
          label="희망 장소"
          value={pickupZoneId}
          onChange={(e) => setPickupZoneId(e.target.value)}
          options={(zones.data ?? []).map((z) => ({
            value: z.id,
            label: z.name,
          }))}
          placeholder={zones.isPending ? '불러오는 중...' : '픽업존을 선택하세요'}
          required
          error={error?.fieldError('pickup_zone_id')}
        />

        <Input
          label="시작 시간"
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
          options={DURATION_OPTIONS.map((m) => ({
            value: String(m),
            label: formatDuration(m),
          }))}
          required
        />

        {dueAtPreview && (
          <p className="rounded-btn bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
            반납 예정 시간은 <strong>{formatDateTime(dueAtPreview.toISOString())}</strong>{' '}
            입니다. 이 시간을 넘기면 반납 지연으로 표시돼요.
          </p>
        )}

        <Input
          label="사용료"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          hint="0원이면 무료로 표시돼요."
        />

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigate(-1)}
          >
            취소
          </Button>
          <Button
            type="submit"
            fullWidth
            loading={create.isPending}
            disabled={!pickupZoneId}
          >
            요청 등록하기
          </Button>
        </div>
      </form>
    </>
  );
}
