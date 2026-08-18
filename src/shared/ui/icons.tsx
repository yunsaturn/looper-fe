import type { NavIconName } from '@/shared/config/navigation';

/**
 * 아이콘은 인라인 SVG 로 둔다. 아이콘 라이브러리를 넣으면 번들이 커지고
 * 해커톤 기간에 필요한 건 여섯 개뿐이다. 모두 currentColor 를 따른다.
 */

type IconProps = { className?: string };

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Svg({
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? 'h-6 w-6'}
      aria-hidden="true"
      {...STROKE}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </Svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function HandshakeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 12.5 7 8l3.5 2.5L14 8l4 4.5" />
      <path d="M7 8 4 11v5l3 3 5-4 5 4 3-3v-5l-3-3" />
    </Svg>
  );
}

export function LeafIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 4c0 9-5.5 14-12 14a6 6 0 0 1 0-12c4.5 0 7-2 12-2Z" />
      <path d="M4 20c3-6 7-9 12-11" />
    </Svg>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Svg>
  );
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m14.5 5-6.5 7 6.5 7" />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

const NAV_ICONS: Record<NavIconName, (p: IconProps) => React.ReactElement> = {
  home: HomeIcon,
  search: SearchIcon,
  plus: PlusIcon,
  handshake: HandshakeIcon,
  leaf: LeafIcon,
  user: UserIcon,
};

export function NavIcon({
  name,
  className,
}: {
  name: NavIconName;
  className?: string;
}) {
  const Component = NAV_ICONS[name];
  return <Component className={className} />;
}
