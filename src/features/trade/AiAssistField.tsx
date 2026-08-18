import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { aiApi } from '@/entities/ai/api';
import type { AiCandidate, ListingAssistResponse } from '@/entities/ai/types';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/entities/storage/api';
import {
  AI_STATUS,
  CATEGORY_LABEL,
  type ItemCondition,
} from '@/shared/config/categories';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';

const MAX_IMAGE_COUNT = 5;

/**
 * 이미지 업로드 → AI 상품명·카테고리 추천 → 사용자 확정.
 *
 * 기획서 R4 대응이 이 컴포넌트의 존재 이유다.
 *   - AI 는 확정 판단이 아니라 입력 보조다. 추천은 항상 수정할 수 있다.
 *   - 후보는 최대 3개까지만 보여주고 선택지를 남긴다.
 *   - 분석 실패·저신뢰·지연 시 즉시 직접 입력으로 폴백한다.
 *
 * 서버는 AI 가 죽어도 HTTP 200 에 fallback_required=true 를 담아 주므로,
 * 화면은 HTTP 오류가 아니라 응답 본문을 보고 분기한다.
 */

export interface AiAssistResult {
  analysisId: string | null;
  itemName: string;
  category: ListingAssistResponse['carbon_sector'];
  descriptionDraft: string | null;
}

interface Props {
  /** 사용자가 이미 입력한 제목. 있으면 AI 1순위 후보보다 우선한다 */
  userTitle: string;
  condition: ItemCondition;
  /** 후보를 고르면 상위 폼의 상품명·카테고리·설명을 채운다 */
  onApply: (result: AiAssistResult) => void;
  /** 업로드한 이미지 파일들. 등록 시 선택 순서대로 스토리지에 올린다 */
  onFilesChange: (files: File[]) => void;
}

export function AiAssistField({
  userTitle,
  condition,
  onApply,
  onFilesChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [appliedName, setAppliedName] = useState<string | null>(null);

  useEffect(
    () => () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    },
    [previewUrls],
  );

  const assist = useMutation({
    mutationFn: (file: File) =>
      aiApi.listingAssist({
        image: file,
        condition,
        user_title: userTitle || undefined,
      }),
  });

  const pickFiles = (files: File[]) => {
    setLocalError(null);

    if (files.length > MAX_IMAGE_COUNT) {
      setLocalError(`사진은 최대 ${MAX_IMAGE_COUNT}장까지 올릴 수 있어요.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const unsupportedFile = files.find(
      (file) =>
        !ALLOWED_IMAGE_TYPES.includes(
          file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
        ),
    );
    if (unsupportedFile) {
      setLocalError(
        `${unsupportedFile.name}: JPG, PNG, WEBP 이미지만 올릴 수 있어요.`,
      );
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_BYTES);
    if (oversizedFile) {
      setLocalError(
        `${oversizedFile.name}: 이미지 용량은 10MB 이하만 가능해요.`,
      );
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setAppliedName(null);
    assist.reset();

    if (files.length === 0) {
      setPreviewUrls([]);
      onFilesChange([]);
      return;
    }

    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
    onFilesChange(files);
    // 첫 번째 사진을 대표 이미지이자 AI 분석 대상으로 사용한다.
    assist.mutate(files[0]);
  };

  const applyCandidate = (candidate: AiCandidate) => {
    setAppliedName(candidate.item_name);
    onApply({
      analysisId: assist.data?.analysis_id ?? null,
      itemName: candidate.item_name,
      category: candidate.category,
      descriptionDraft: assist.data?.description_draft ?? null,
    });
  };

  const data = assist.data;
  // 네트워크 자체가 끊긴 경우에도 직접 입력으로 넘어갈 수 있어야 한다
  const needsFallback = Boolean(data?.fallback_required) || assist.isError;

  return (
    <Field label="상품 사진 (최대 5장)" required>
      <div className="grid gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => pickFiles(Array.from(e.target.files ?? []))}
        />

        {previewUrls.length > 0 ? (
          <div className="grid gap-3">
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {previewUrls.map((url, index) => (
                <li key={url} className="relative aspect-square min-w-0">
                  <img
                    src={url}
                    alt={`업로드한 상품 사진 ${index + 1} 미리보기`}
                    className="h-full w-full rounded-card border border-ink-200 object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-chip bg-ink-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                      대표
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-400">
              첫 번째 사진을 대표 이미지와 AI 분석에 사용해요.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                사진 다시 선택
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  pickFiles([]);
                  if (inputRef.current) inputRef.current.value = '';
                }}
              >
                전체 선택 취소
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-card border border-dashed border-ink-300 text-sm text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-700"
          >
            <span className="text-lg">＋</span>
            사진 여러 장 선택하기
            <span className="text-xs text-ink-400">
              1~5장 · JPG PNG WEBP · 장당 10MB 이하
            </span>
          </button>
        )}

        <p className="rounded-btn bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-800">
          촬영 안내: 물건이 배경과 뚜렷하게 구별되도록 하고, 사진 한 장에는 물건
          하나만 선명하게 보이도록 촬영해주세요.
        </p>

        {localError && (
          <p className="text-xs text-tone-danger-fg">{localError}</p>
        )}

        {assist.isPending && (
          <div className="flex items-center gap-2 rounded-btn bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"
              aria-hidden="true"
            />
            사진을 분석하고 있어요…
          </div>
        )}

        {/* 성공 — 후보를 최대 3개까지 제시하고 사용자가 고른다 */}
        {data && data.candidates.length > 0 && (
          <div className="grid gap-2">
            <p className="text-xs font-medium text-ink-600">
              추천 상품명{' '}
              {data.ai_status === AI_STATUS.LOW_CONFIDENCE && '(신뢰도 낮음)'}
            </p>
            <ul className="grid gap-1.5">
              {data.candidates.slice(0, 3).map((candidate) => (
                <li key={candidate.item_name}>
                  <button
                    type="button"
                    onClick={() => applyCandidate(candidate)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-btn border px-3 py-2.5 text-left text-sm transition-colors',
                      appliedName === candidate.item_name
                        ? 'border-brand-500 bg-brand-50 text-brand-800'
                        : 'border-ink-200 hover:border-brand-300',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{candidate.item_name}</span>
                      <span className="ml-1.5 text-xs text-ink-400">
                        {CATEGORY_LABEL[candidate.category]}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-ink-400">
                      {Math.round(candidate.confidence * 100)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-400">
              AI 추천이라 정확하지 않을 수 있어요. 눌러서 채운 뒤 직접 고치셔도
              됩니다.
            </p>
          </div>
        )}

        {/* 저신뢰·장애 — 직접 입력으로 전환 안내 */}
        {needsFallback && (
          <div className="rounded-btn bg-tone-warning-bg px-3 py-2.5 text-sm text-tone-warning-fg">
            {data?.message ?? 'AI 분석을 사용할 수 없어 직접 입력이 필요해요.'}
            <span className="mt-0.5 block text-xs">
              아래 항목을 직접 채우시면 등록에는 문제가 없어요.
            </span>
          </div>
        )}
      </div>
    </Field>
  );
}
