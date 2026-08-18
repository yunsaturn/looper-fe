import { cn } from '@/shared/lib/cn';
import { formatCarbon } from '@/shared/lib/carbon';

/**
 * 탄소 수치를 보여주는 컴포넌트.
 *
 * 기획서 R3(그린워싱 지적 위험) 대응으로 `disclaimer` 를 **필수 prop** 으로
 * 둔다. 타입 시스템이 각주 없는 렌더링을 컴파일 타임에 막는다.
 * 문구는 서버가 임팩트 응답에 담아 내려주므로 그대로 쓴다.
 */
export function CarbonHeroCard({
  label,
  kgCO2e,
  disclaimer,
  caption,
  className,
}: {
  label: string;
  kgCO2e: number;
  /** 필수 — 각주 없이 탄소 수치를 노출하지 않는다 */
  disclaimer: string;
  caption?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-card bg-brand-50 p-5 ring-1 ring-brand-100',
        className,
      )}
    >
      <p className="text-sm font-medium text-brand-700">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-brand-800 tabular-nums">
        {formatCarbon(kgCO2e)}
      </p>
      {caption && <p className="mt-2 text-sm text-brand-700/80">{caption}</p>}
      <p className="mt-3 text-xs text-brand-700/60">{disclaimer}</p>
    </div>
  );
}

/**
 * 실측값 타일. 절약 금액·줄인 폐기물처럼 추정이 아닌 값에 쓴다.
 * 기획서 표기 우선순위상 이 타일이 탄소 카드보다 **위**에 온다.
 */
export function ImpactStatCard({
  label,
  value,
  unit,
  caption,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-ink-200 bg-white p-4',
        className,
      )}
    >
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink-900 tabular-nums">
        {value}
        {unit && (
          <span className="ml-0.5 text-sm font-semibold text-ink-600">
            {unit}
          </span>
        )}
      </p>
      {caption && <p className="mt-1 text-xs text-ink-400">{caption}</p>}
    </div>
  );
}
