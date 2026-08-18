import { cn } from '@/shared/lib/cn';

/**
 * 사용자 아바타.
 *
 * 프로필 사진이 있으면 사진, 없으면 닉네임 첫 글자를 보여준다.
 * 헤더·마이프로필·상대방 프로필이 같은 모양을 써야 해서 shared 에 둔다.
 */
export function Avatar({
  nickname,
  imageUrl,
  className,
}: {
  nickname?: string | null;
  imageUrl?: string | null;
  className?: string;
}) {
  const base = cn(
    'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xl font-bold text-brand-700',
    className,
  );

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={nickname ? `${nickname} 프로필 사진` : '프로필 사진'}
        className={cn(base, 'object-cover')}
      />
    );
  }
  return (
    <div aria-hidden className={base}>
      {nickname?.[0] ?? '?'}
    </div>
  );
}
