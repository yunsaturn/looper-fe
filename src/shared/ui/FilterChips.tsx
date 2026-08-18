import { cn } from '@/shared/lib/cn';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/**
 * 단일 선택 칩.
 *
 * 기본은 필터용이라 맨 앞에 `전체`(=선택 해제) 칩이 붙는다.
 * Figma 홈 피드의 전체/판매/나눔/구합니다 칩이 이 형태다.
 *
 * `allLabel={null}` 을 주면 `전체` 칩 없이 옵션만 렌더링한다.
 * 거래 유형처럼 반드시 하나를 골라야 하는 입력에 쓴다.
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  allLabel = '전체',
  className,
}: {
  options: ReadonlyArray<ChipOption<T>>;
  value: T | undefined;
  onChange: (next: T | undefined) => void;
  allLabel?: string | null;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {allLabel !== null && (
        <Chip
          selected={value === undefined}
          onClick={() => onChange(undefined)}
        >
          {allLabel}
        </Chip>
      )}
      {options.map((o) => (
        <Chip
          key={o.value}
          selected={value === o.value}
          onClick={() =>
            // 필수 선택 모드(전체 칩 없음)에서는 선택 해제를 허용하지 않는다
            onChange(
              value === o.value && allLabel !== null ? undefined : o.value,
            )
          }
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-chip border px-3.5 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
      )}
    >
      {children}
    </button>
  );
}
