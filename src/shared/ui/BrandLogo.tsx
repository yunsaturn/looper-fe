import { cn } from '@/shared/lib/cn';

/**
 * 루퍼 워드마크.
 *
 * 로고는 가로:세로 약 1.9:1 이다. 정사각형 상자에 넣으면 글자가 눌리므로
 * 높이만 지정하고 너비는 `w-auto` 로 둔다. 헤더·로그인·회원가입·랜딩이 같은
 * 자산을 쓰므로 여기 한 곳에서 크기 규칙을 관리한다.
 *
 * `img` 는 인라인이라 가운데 정렬은 부모의 `text-center` 가 처리한다.
 * 컴포넌트가 `mx-auto` 를 갖고 있으면 헤더처럼 왼쪽에 두는 곳에서 되돌릴
 * 방법이 없다(cn 은 단순 결합이라 뒤 클래스가 이긴다는 보장이 없다).
 */
export function BrandLogo({
  size = 'md',
  className,
}: {
  /** sm 헤더 · md 로그인·회원가입 · lg 랜딩 히어로 */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  /*
   * 헤더만 작다 — 헤더 높이가 56/64px 이라 로고가 그 안에 들어가야 한다.
   * 나머지는 화면의 주인공이므로 시원하게 키운다. 특히 랜딩은 Figma 에서
   * 카드 너비의 40% 남짓을 차지한다.
   */
  const height = {
    sm: 'h-10 md:h-12',
    md: 'h-16 md:h-20',
    lg: 'h-28 md:h-32',
  }[size];

  return (
    <img
      src="/logo.png"
      alt="루퍼"
      width={3728}
      height={1960}
      className={cn('inline-block w-auto align-middle', height, className)}
    />
  );
}
