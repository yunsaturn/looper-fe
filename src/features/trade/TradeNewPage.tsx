import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { metaApi } from '@/entities/meta/api';
import { tradeApi } from '@/entities/trade/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ApiError } from '@/shared/api/errors';
import {
  CATEGORY_FILTERS,
  CATEGORY_LABEL,
  ITEM_CONDITIONS,
  ITEM_CONDITION,
  ITEM_CONDITION_LABEL,
  TRADE_TYPE,
  TRADE_TYPE_FILTERS,
  TRADE_TYPE_LABEL,
  type Category,
  type ItemCondition,
  type TradeType,
} from '@/shared/config/categories';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { Button } from '@/shared/ui/Button';
import { Field, Input, Select, Textarea } from '@/shared/ui/Field';
import { FilterChips } from '@/shared/ui/FilterChips';
import { useToast } from '@/shared/ui/Toast';
import { PageTitle } from '@/app/layouts/StackLayout';

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * 게시물 등록.
 *
 * AI 이미지 추천은 별도 엔드포인트(/api/v1/ai/listing-assist)로 붙는다.
 * 지금은 직접 입력 경로를 먼저 완성했다 — 기획서 R4 원칙상 AI 는 보조이고
 * 직접 입력이 항상 가능해야 하므로, 이쪽이 기본 경로다.
 */
export function TradeNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const campusId = useAuthStore((s) => s.campusId);

  const [tradeType, setTradeType] = useState<TradeType>(TRADE_TYPE.SALE);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORY_FILTERS[0]);
  const [condition, setCondition] = useState<ItemCondition>(
    ITEM_CONDITION.GOOD,
  );
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [availableDate, setAvailableDate] = useState(TODAY);
  const [pickupZoneId, setPickupZoneId] = useState('');

  const zones = useQuery({
    queryKey: queryKeys.pickupZones(campusId ?? ''),
    queryFn: () => metaApi.pickupZones(campusId!),
    enabled: Boolean(campusId),
  });

  const create = useMutation({
    mutationFn: () =>
      tradeApi.create({
        trade_type: tradeType,
        title,
        description,
        category,
        condition,
        // 나눔은 서버가 0으로 고정하지만, 보내는 값도 맞춰둔다
        price: tradeType === TRADE_TYPE.SHARE ? 0 : Number(price || 0),
        weight_kg: weight ? Number(weight) : null,
        available_date: availableDate,
        pickup_zone_id: pickupZoneId,
        image_urls: [],
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
      toast.show('게시물을 등록했어요.', 'success');
      navigate(buildPath(ROUTES.TRADE_DETAIL, { tradeId: created.id }), {
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
  const isShare = tradeType === TRADE_TYPE.SHARE;
  const isWanted = tradeType === TRADE_TYPE.WANTED;

  return (
    <>
      <PageTitle
        title="게시물 등록"
        description="거래 가능 날짜와 픽업존을 함께 정하면 미래 시점 예약도 가능해요."
      />

      <form
        className="grid max-w-2xl gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Field label="거래 유형" required>
          <FilterChips
            options={TRADE_TYPE_FILTERS.map((t) => ({
              value: t,
              label: TRADE_TYPE_LABEL[t],
            }))}
            value={tradeType}
            onChange={(next) => setTradeType(next ?? TRADE_TYPE.SALE)}
            allLabel="판매"
          />
        </Field>

        <Input
          label="상품명"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 1인용 미니 밥솥"
          required
          error={error?.fieldError('title')}
        />

        <Textarea
          label="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="사용 기간, 상태, 함께 드리는 구성품 등을 적어주세요."
          required
          error={error?.fieldError('description')}
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
          hint="카테고리는 탄소 절감량 계산의 섹터로도 쓰여요."
        />

        <Select
          label="상품 상태"
          value={condition}
          onChange={(e) => setCondition(e.target.value as ItemCondition)}
          options={ITEM_CONDITIONS.map((c) => ({
            value: c,
            label: ITEM_CONDITION_LABEL[c],
          }))}
          required
        />

        {!isShare && (
          <Input
            label={isWanted ? '희망 가격' : '판매 가격'}
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            required={!isWanted}
            hint={isWanted ? '구합니다는 희망 가격을 비워둘 수 있어요.' : undefined}
            error={error?.fieldError('price')}
          />
        )}

        {isShare && (
          <p className="rounded-btn bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
            나눔은 가격이 0원으로 자동 처리돼요.
          </p>
        )}

        <Input
          label="무게 (kg)"
          type="number"
          min={0}
          step={0.1}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="2.4"
          hint="탄소 절감량 계산에 쓰여요. 모르면 비워두셔도 됩니다."
        />

        <Input
          label="거래 가능 날짜"
          type="date"
          min={TODAY}
          value={availableDate}
          onChange={(e) => setAvailableDate(e.target.value)}
          required
          hint="오늘 또는 미래 날짜만 선택할 수 있어요. 퇴실일처럼 아직 오지 않은 날짜도 괜찮아요."
          error={error?.fieldError('available_date')}
        />

        <Select
          label="픽업존"
          value={pickupZoneId}
          onChange={(e) => setPickupZoneId(e.target.value)}
          options={(zones.data ?? []).map((z) => ({
            value: z.id,
            label: z.name,
          }))}
          placeholder={zones.isPending ? '불러오는 중...' : '픽업존을 선택하세요'}
          required
          hint="교내 지정 픽업존에서만 물건을 주고받아요."
          error={error?.fieldError('pickup_zone_id')}
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
            등록하기
          </Button>
        </div>
      </form>
    </>
  );
}
