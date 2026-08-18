import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { metaApi } from '@/entities/meta/api';
import { PickupZoneSelector } from '@/entities/meta/PickupZoneSelector';
import type { PickupZoneItem } from '@/entities/meta/types';
import { tradeApi } from '@/entities/trade/api';
import { ApiError } from '@/shared/api/errors';
import { queryKeys } from '@/shared/api/queryKeys';
import { TRADE_TYPE } from '@/shared/config/categories';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import { TRADE_STATUS } from '@/shared/config/status';
import { toLocalDateValue } from '@/shared/lib/format';
import { useAuthStore } from '@/shared/store/authStore';
import { Button } from '@/shared/ui/Button';
import { Field, Input, Textarea } from '@/shared/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/useToast';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 게시물 수정.
 *
 * 서버가 고칠 수 있게 열어둔 항목만 폼에 둔다 — 제목·설명·가격·거래 가능
 * 날짜·픽업존. 카테고리와 상품 상태, 무게, 사진은 수정 대상이 아니다.
 * 특히 무게는 탄소 절감량 계산의 입력이라 등록 시점 값으로 고정된다.
 *
 * 수정은 **거래 가능(AVAILABLE) 상태에서만** 된다. 예약이 잡힌 뒤에 조건이
 * 바뀌면 신청자가 동의한 내용과 달라지기 때문이다. 서버도 같은 규칙을
 * 강제하므로 화면은 그 이유를 설명하는 역할만 한다.
 */
export function TradeEditPage() {
  const { tradeId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const myId = useAuthStore((s) => s.userId);
  const campusId = useAuthStore((s) => s.campusId);

  const trade = useQuery({
    queryKey: queryKeys.trades.detail(tradeId),
    queryFn: () => tradeApi.detail(tradeId),
    enabled: Boolean(tradeId),
  });

  const zones = useQuery({
    queryKey: queryKeys.pickupZones(campusId ?? ''),
    queryFn: () => metaApi.pickupZones(campusId!),
    enabled: Boolean(campusId),
  });

  if (trade.isPending) {
    return (
      <div className="grid max-w-2xl gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (trade.isError) {
    return <ErrorState error={trade.error} onRetry={() => trade.refetch()} />;
  }

  const data = trade.data;

  if (data.author.id !== myId) {
    return (
      <EmptyState
        title="수정할 수 없는 게시물이에요"
        description="본인이 등록한 게시물만 수정할 수 있어요."
      />
    );
  }

  if (data.status !== TRADE_STATUS.AVAILABLE) {
    return (
      <EmptyState
        title="지금은 수정할 수 없어요"
        description="신청자를 수락한 뒤에는 거래 조건을 바꿀 수 없어요. 예약을 취소하면 다시 수정할 수 있습니다."
      />
    );
  }

  return (
    <TradeEditForm
      trade={data}
      zones={zones.data ?? []}
      zonesLoading={zones.isPending}
      zonesError={zones.isError}
      onZonesRetry={() => zones.refetch()}
      onSaved={() => {
        toast.show('게시물을 수정했어요.', 'success');
        // 목록·상세가 모두 바뀌므로 거래 트리 전체를 무효화한다 (R5)
        void queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
        navigate(buildPath(ROUTES.TRADE_DETAIL, { tradeId }), {
          replace: true,
        });
      }}
      onCancel={() => navigate(-1)}
    />
  );
}

function TradeEditForm({
  trade,
  zones,
  zonesLoading,
  zonesError,
  onZonesRetry,
  onSaved,
  onCancel,
}: {
  trade: {
    id: string;
    trade_type: string;
    title: string;
    description: string;
    price?: number | null;
    available_date: string;
    pickup_zone: { id: string };
  };
  zones: PickupZoneItem[];
  zonesLoading: boolean;
  zonesError: boolean;
  onZonesRetry: () => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(trade.title);
  const [description, setDescription] = useState(trade.description);
  const [price, setPrice] = useState(String(trade.price ?? 0));
  const [availableDate, setAvailableDate] = useState(trade.available_date);
  const [pickupZoneId, setPickupZoneId] = useState(trade.pickup_zone.id);

  const isShare = trade.trade_type === TRADE_TYPE.SHARE;
  const isWanted = trade.trade_type === TRADE_TYPE.WANTED;

  const save = useMutation({
    mutationFn: () =>
      tradeApi.update(trade.id, {
        title,
        description,
        // 나눔은 서버가 0 으로 고정하므로 아예 보내지 않는다
        price: isShare ? undefined : Number(price || 0),
        available_date: availableDate,
        pickup_zone_id: pickupZoneId,
      }),
    onSuccess: onSaved,
  });

  const error = save.error instanceof ApiError ? save.error : null;
  const today = toLocalDateValue(new Date());

  return (
    <>
      <PageTitle
        title="게시물 수정"
        description="거래 가능 상태일 때만 수정할 수 있어요."
      />

      <form
        className="grid max-w-2xl gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Input
          label="상품명"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          error={error?.fieldError('title')}
        />

        <Textarea
          label="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={3000}
          required
          error={error?.fieldError('description')}
        />

        {isShare ? (
          <p className="rounded-btn bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
            나눔은 가격이 0원으로 고정돼요.
          </p>
        ) : (
          <Input
            label={isWanted ? '희망 가격' : '판매 가격'}
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required={!isWanted}
            error={error?.fieldError('price')}
          />
        )}

        <Input
          label="거래 가능 날짜"
          type="date"
          min={today}
          value={availableDate}
          onChange={(e) => setAvailableDate(e.target.value)}
          required
          hint="오늘 또는 미래 날짜만 선택할 수 있어요."
          error={error?.fieldError('available_date')}
        />

        <Field
          label="픽업존"
          required
          hint="지도 마커나 목록에서 픽업존을 고르세요."
        >
          <PickupZoneSelector
            zones={zones}
            value={pickupZoneId}
            onChange={setPickupZoneId}
            loading={zonesLoading}
            error={
              zonesError
                ? '픽업존을 불러오지 못했어요.'
                : error?.fieldError('pickup_zone_id')
            }
            onRetry={zonesError ? onZonesRetry : undefined}
          />
        </Field>

        <p className="rounded-card bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          카테고리·상품 상태·무게·사진은 수정할 수 없어요. 무게는 탄소 절감량
          계산에 쓰이기 때문에 등록할 때 값으로 고정됩니다. 바꿔야 한다면 글을
          다시 등록해주세요.
        </p>

        {error && (
          <div className="rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
            <p>{error.message}</p>
            {error
              .unshownFieldErrors([
                'title',
                'description',
                'price',
                'available_date',
                'pickup_zone_id',
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
