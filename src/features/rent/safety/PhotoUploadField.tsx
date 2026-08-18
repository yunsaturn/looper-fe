import { useRef, useState } from 'react';

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/entities/storage/api';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';

const MAX_PHOTOS = 4;

interface Props {
  label?: string;
  hint?: string;
  files: File[];
  onChange: (files: File[]) => void;
}

/**
 * 기준 사진 업로드 — 최소 1장, 추가는 선택.
 * 등록 시점에 storageApi.upload 로 올린다.
 */
export function PhotoUploadField({
  label = '기준 사진',
  hint = '물품 전체가 잘 보이도록 1장 이상 촬영해 주세요. 추가 사진은 선택이에요.',
  files,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const pickFiles = (picked: File[]) => {
    setError(null);

    if (picked.length > MAX_PHOTOS) {
      setError(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const invalidType = picked.find(
      (file) =>
        !ALLOWED_IMAGE_TYPES.includes(
          file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
        ),
    );
    if (invalidType) {
      setError(`${invalidType.name}: JPG, PNG, WEBP 이미지만 올릴 수 있어요.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const oversized = picked.find((file) => file.size > MAX_IMAGE_BYTES);
    if (oversized) {
      setError(`${oversized.name}: 이미지 용량은 10MB 이하만 가능해요.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    onChange(picked);
  };

  return (
    <Field label={label} required hint={hint}>
      <div className="grid gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          capture="environment"
          className="sr-only"
          onChange={(e) => pickFiles(Array.from(e.target.files ?? []))}
        />

        {files.length > 0 ? (
          <div className="grid gap-3">
            <p className="rounded-btn bg-ink-50 px-3 py-2 text-sm text-ink-600">
              사진 {files.length}장이 선택되었어요.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                사진 추가·변경
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
                전체 취소
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex h-32 w-full flex-col items-center justify-center gap-1 rounded-card',
              'border border-dashed border-ink-300 text-sm text-ink-500',
              'transition-colors hover:border-brand-400 hover:text-brand-700',
            )}
          >
            <span className="text-lg">＋</span>
            사진 촬영 또는 선택
            <span className="text-xs text-ink-400">
              1장 필수 · 최대 {MAX_PHOTOS}장
            </span>
          </button>
        )}

        {error && <p className="text-xs text-tone-danger-fg">{error}</p>}
      </div>
    </Field>
  );
}
