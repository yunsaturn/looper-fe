import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
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
  bio,
  imageUrl,
  verified,
  joinedAt,
  action,
}: {
  nickname: string;
  trustScore: number;
  /** 학교 · 캠퍼스 */
  affiliation: string;
  /** 학과 · 학년처럼 부가적인 한 줄 */
  meta?: string;
  /** 자기소개. 줄바꿈을 살려 보여준다 */
  bio?: string | null;
  imageUrl?: string | null;
  /** 학교 이메일 인증 여부 — 거래 상대를 가늠하는 첫 단서다 */
  verified?: boolean;
  joinedAt?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-ink-200 p-4">
      <div className="flex items-start gap-4">
        <Avatar nickname={nickname} imageUrl={imageUrl} />

        <div className="min-w-0 grow">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-bold text-ink-900">
              {nickname}
            </h1>
            <TrustScoreBadge score={trustScore} />
            {verified && <VerifiedBadge />}
          </div>
          <p className="mt-1 truncate text-sm text-ink-600">{affiliation}</p>
          {meta && (
            <p className="mt-0.5 truncate text-xs text-ink-400">{meta}</p>
          )}
          {joinedAt && (
            <p className="mt-0.5 text-xs text-ink-400">
              {formatDate(joinedAt)} 가입
            </p>
          )}
        </div>

        {action}
      </div>

      {bio && (
        <p className="mt-3 border-t border-ink-100 pt-3 text-sm leading-relaxed whitespace-pre-wrap text-ink-600">
          {bio}
        </p>
      )}
    </section>
  );
}

/** 프로필 사진이 있으면 사진, 없으면 닉네임 첫 글자 */
export function Avatar({
  nickname,
  imageUrl,
  className,
}: {
  nickname: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const base = cn(
    'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xl font-bold text-brand-700',
    className,
  );

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${nickname} 프로필 사진`}
        className={cn(base, 'object-cover')}
      />
    );
  }
  return (
    <div aria-hidden className={base}>
      {nickname.slice(0, 1)}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-chip bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
        <path
          d="M6.5 10.6 4 8.1l-1 1 3.5 3.5 7-7-1-1z"
          className="fill-current"
        />
      </svg>
      학교 인증
    </span>
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
