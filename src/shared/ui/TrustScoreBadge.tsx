import { cn } from '@/shared/lib/cn';

/**
 * 규칙 기반 신뢰도 점수.
 * 거래·반납 완료 시 오르고, 확정 후 취소·반납 지연 시 내려간다.
 * 기획서 원칙: 처벌이 아니라 성실한 거래를 가시화하는 장치다.
 * 그래서 낮은 점수도 붉은 경고색으로 칠하지 않는다.
 */
export function TrustScoreBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-chip bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700',
        className,
      )}
    >
      신뢰도 {score}
    </span>
  );
}

/** 닉네임 + 신뢰도를 함께 쓰는 조합 */
export function UserInline({
  nickname,
  trustScore,
  suffix,
  className,
}: {
  nickname: string;
  trustScore: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 text-xs',
        className,
      )}
    >
      {/* 좁은 카드에서는 닉네임이 두 줄로 접히는 대신 말줄임된다 */}
      <span className="truncate font-medium text-ink-700">{nickname}</span>
      {suffix && <span className="text-ink-400">· {suffix}</span>}
      <TrustScoreBadge score={trustScore} />
    </span>
  );
}
