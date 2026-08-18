import { cn } from '@/shared/lib/cn';
import { TrustScoreBadge } from '@/shared/ui/TrustScoreBadge';

/**
 * 내 프로필과 상대방 프로필이 공유하는 머리 부분.
 *
 * 두 화면이 보여주는 정보의 범위는 다르지만(기획서 R6 — 공개 프로필에는
 * 이메일 같은 계정 정보를 내리지 않는다), 생김새는 같아야 같은 서비스로
 * 읽힌다. 그래서 레이아웃만 공유하고 무엇을 넣을지는 각 화면이 정한다.
 */
export function ProfileSummary({
  nickname,
  trustScore,
  affiliation,
  meta,
  action,
}: {
  nickname: string;
  trustScore: number;
  /** 학교 · 캠퍼스 */
  affiliation: string;
  /** 학과 · 주 이용 건물처럼 부가적인 한 줄 */
  meta?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex items-start gap-4 rounded-card border border-ink-200 p-4">
      <div
        aria-hidden
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700"
      >
        {nickname.slice(0, 1)}
      </div>

      <div className="min-w-0 grow">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-bold text-ink-900">{nickname}</h1>
          <TrustScoreBadge score={trustScore} />
        </div>
        <p className="mt-1 truncate text-sm text-ink-600">{affiliation}</p>
        {meta && <p className="mt-0.5 truncate text-xs text-ink-400">{meta}</p>}
      </div>

      {action}
    </section>
  );
}

/** 거래·대여 완료 건수처럼 숫자 두세 개를 나란히 보여주는 칸 */
export function ProfileStats({
  items,
  className,
}: {
  items: { label: string; value: number; unit?: string }[];
  className?: string;
}) {
  return (
    <section
      className={cn(
        'grid gap-3 rounded-card border border-ink-200 p-4',
        items.length === 3 ? 'grid-cols-3' : 'grid-cols-2',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <p className="text-xs text-ink-500">{item.label}</p>
          <p className="mt-1 text-xl font-bold text-ink-900 tabular-nums">
            {item.value.toLocaleString('ko-KR')}
            {item.unit && (
              <span className="ml-0.5 text-sm font-semibold text-ink-500">
                {item.unit}
              </span>
            )}
          </p>
        </div>
      ))}
    </section>
  );
}
