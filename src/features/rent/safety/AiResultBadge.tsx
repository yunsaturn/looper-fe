import type { AiCompareResult } from '@/entities/rental/safety/types';
import { AI_CONDITION_META } from '@/shared/config/safety';
import { TONE_CLASS } from '@/shared/config/status';
import { cn } from '@/shared/lib/cn';

interface Props {
  result: AiCompareResult;
  className?: string;
}

/** AI 비교 결과 — 정상 / 확인 필요 / 손상 의심 만 표시한다 */
export function AiResultBadge({ result, className }: Props) {
  const meta = AI_CONDITION_META[result.status];

  return (
    <div
      className={cn(
        'rounded-card border border-ink-200 p-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-chip px-2.5 py-1 text-xs font-bold',
            TONE_CLASS[meta.tone],
          )}
        >
          {meta.label}
        </span>
        <span className="text-xs text-ink-400 tabular-nums">
          의심 점수 {Math.round(result.damage_suspicion_score * 100)}%
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        {result.message ?? meta.description}
      </p>
      {result.needs_retake && (
        <p className="mt-2 rounded-btn bg-tone-warning-bg px-3 py-2 text-xs text-tone-warning-fg">
          구도가 맞지 않거나 흔들려요. 기준 사진과 비슷하게 다시 촬영해 주세요.
        </p>
      )}
    </div>
  );
}

/** 등록된 사진 URL 목록 미리보기 */
export function PhotoGallery({
  urls,
  label,
}: {
  urls: string[];
  label: string;
}) {
  if (urls.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-ink-500">{label}</p>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {urls.map((url, i) => (
          <li key={url} className="aspect-square min-w-0">
            <img
              src={url}
              alt={`${label} ${i + 1}`}
              className="h-full w-full rounded-card border border-ink-200 object-cover"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
