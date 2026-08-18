import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { metaApi } from '@/entities/meta/api';
import { PickupZoneSelector } from '@/entities/meta/PickupZoneSelector';
import { storageApi } from '@/entities/storage/api';
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
import { useToast } from '@/shared/ui/useToast';
import { PageTitle } from '@/app/layouts/StackLayout';
import { AiAssistField, type AiAssistResult } from './AiAssistField';

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * 게시물 등록.
 *
 * 흐름: 이미지 업로드 → AI 가 상품명·카테고리 후보 제시 → 사용자가 확인·수정
 *       → 가격·상태·거래 날짜·픽업존 입력 → 등록
 *
 * AI 는 보조일 뿐이라 사진 없이도 끝까지 등록할 수 있어야 한다. (기획서 R4)
 * 그래서 이미지·AI 는 폼의 선택 항목이고, 아래 입력들이 항상 기본 경로다.
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  /** AI 후보를 고르면 폼을 채운다. 이후 사용자가 자유롭게 고칠 수 있다. */
  const applyAiResult = (result: AiAssistResult) => {
    setTitle(result.itemName);
    if (result.category) setCategory(result.category);
    // 설명 초안은 비어 있을 때만 채운다 — 사용자가 쓴 내용을 덮어쓰지 않는다
    if (result.descriptionDraft && !description.trim()) {
      setDescription(result.descriptionDraft);
    }
    setAnalysisId(result.analysisId);
  };

  const zones = useQuery({
    queryKey: queryKeys.pickupZones(campusId ?? ''),
    queryFn: () => metaApi.pickupZones(campusId!),
    enabled: Boolean(campusId),
  });

  const create = useMutation({
    mutationFn: async () => {
      // 이미지는 API 서버를 거치지 않고 스토리지로 직접 올린 뒤 공개 URL 만 넘긴다.
      //
      // ⚠️ 서버는 image_urls 를 @NotEmpty 로 강제한다. 업로드가 실패했을 때
      //    빈 배열로 그냥 보내면 400 이 떨어지는데, 화면에는 "잘못된 요청"
      //    이라고만 떠서 원인을 알 수 없다. 그래서 여기서 먼저 끊는다.
      if (!imageFile) {
        throw new Error('사진을 한 장 이상 첨부해주세요.');
      }

      let imageUrls: string[];
      try {
        imageUrls = [await storageApi.upload(imageFile)];
      } catch {
        throw new Error(
          '사진 업로드에 실패했어요. 잠시 뒤 다시 시도하거나 다른 사진으로 바꿔보세요.',
        );
      }

      return tradeApi.create({
        trade_type: tradeType,
        title,
        description,
        category,
        condition,
        // 나눔은 서버가 0으로 고정하지만, 보내는 값도 맞춰둔다
        price:
          tradeType === TRADE_TYPE.SHARE
            ? 0
            : tradeType === TRADE_TYPE.WANTED && price.trim() === ''
              ? null
              : Number(price),
        weight_kg: Number(weight),
        available_date: availableDate,
        pickup_zone_id: pickupZoneId,
        image_urls: imageUrls,
        ai_analysis_id: analysisId,
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trades.all });
      toast.show('게시물을 등록했어요.', 'success');
      navigate(buildPath(ROUTES.TRADE_DETAIL, { tradeId: created.id }), {
        replace: true,
      });
    },
    onError: (error) => {
      // 업로드 실패처럼 요청 전에 끊은 경우도 사유를 그대로 보여준다
      toast.show(
        error instanceof Error && error.message
          ? error.message
          : '등록에 실패했어요.',
        'error',
      );
    },
  });

  const error = create.error instanceof ApiError ? create.error : null;
  // 서버에 닿기 전에 끊은 오류(사진 미첨부·업로드 실패)도 폼 위에 남긴다
  const localError =
    create.error && !error && create.error instanceof Error
      ? create.error.message
      : null;
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
        <AiAssistField
          userTitle={title}
          condition={condition}
          onApply={applyAiResult}
          onFileChange={setImageFile}
        />

        <Field label="거래 유형" required>
          <FilterChips
            options={TRADE_TYPE_FILTERS.map((t) => ({
              value: t,
              label: TRADE_TYPE_LABEL[t],
            }))}
            value={tradeType}
            onChange={(next) => setTradeType(next ?? TRADE_TYPE.SALE)}
            allLabel={null}
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
            hint={
              isWanted ? '구합니다는 희망 가격을 비워둘 수 있어요.' : undefined
            }
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
          min={0.1}
          step={0.1}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="2.4"
          required
          hint="탄소 절감량 계산에 쓰여요. 어림값이라도 괜찮지만, 0보다 커야 해요."
          error={error?.fieldError('weight_kg')}
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

        <Field
          label="픽업존"
          required
          hint="교내 지정 픽업존에서만 물건을 주고받아요. 지도 마커나 목록에서 고르세요."
        >
          <PickupZoneSelector
            zones={zones.data ?? []}
            value={pickupZoneId}
            onChange={setPickupZoneId}
            loading={zones.isPending}
            error={
              zones.isError
                ? '픽업존을 불러오지 못했어요.'
                : error?.fieldError('pickup_zone_id')
            }
            onRetry={zones.isError ? () => zones.refetch() : undefined}
          />
        </Field>

        {localError && (
          <p className="rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
            {localError}
          </p>
        )}

        {/* 입력칸이 없는 필드의 오류까지 전부 보여준다 */}
        {error && (
          <div className="rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
            <p>{error.message}</p>
            {error
              .unshownFieldErrors([
                'title',
                'description',
                'price',
                'weight_kg',
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
            onClick={() => navigate(-1)}
          >
            취소
          </Button>
          <Button
            type="submit"
            fullWidth
            loading={create.isPending}
            disabled={!pickupZoneId || !imageFile || !Number(weight)}
          >
            등록하기
          </Button>
        </div>
      </form>
    </>
  );
}
