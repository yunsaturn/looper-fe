/**
 * ─────────────────────────────────────────────────────────────
 *  내비게이션 · 라우트 단일 출처
 * ─────────────────────────────────────────────────────────────
 *  Figma 와이어프레임이 기준이다. (기획서 PDF 목업보다 최신)
 *
 *  모바일 — 하단 탭 5개
 *    홈 / 검색 / 거래 등록 / 대여 요청 / 프로필
 *
 *  데스크톱 — 좌측 사이드바 6개
 *    홈 / 물품 탐색 / 게시물 등록 / 대여 요청 / 임팩트 / 마이프로필
 *
 *  두 구성의 차이는 '임팩트' 하나뿐이다. 모바일에서는 하단 탭에 넣지 않고
 *  홈 피드의 임팩트 카드에서 링크로 들어간다.
 *  라벨도 폼팩터별로 다르므로 (검색 ↔ 물품 탐색) 각각 들고 있는다.
 * ─────────────────────────────────────────────────────────────
 */

export const ROUTES = {
  /* 공개 */
  LANDING: '/landing',
  LOGIN: '/login',
  SIGNUP: '/signup',
  EMAIL_VERIFY: '/signup/verify',
  PROFILE_SETUP: '/signup/profile',

  /* 메인 */
  HOME: '/',
  SEARCH: '/search',

  /* 거래 */
  TRADE_LIST: '/trades',
  TRADE_NEW: '/trades/new',
  TRADE_DETAIL: '/trades/:tradeId',
  TRADE_EDIT: '/trades/:tradeId/edit',
  TRADE_APPLICANTS: '/trades/:tradeId/applicants',
  TRADE_RESERVATION: '/trades/:tradeId/reservation',
  TRADE_COMPLETE: '/trades/:tradeId/complete',

  /* 대여 */
  RENTAL_LIST: '/rentals',
  RENTAL_NEW: '/rentals/new',
  RENTAL_DETAIL: '/rentals/:rentalId',
  RENTAL_EDIT: '/rentals/:rentalId/edit',
  RENTAL_OFFERS: '/rentals/:rentalId/offers',
  RENTAL_PROGRESS: '/rentals/:rentalId/progress',
  RENTAL_COMPLETE: '/rentals/:rentalId/complete',

  /* 임팩트 */
  IMPACT: '/impact',
  IMPACT_CAMPUS: '/impact/campus',
  IMPACT_METHOD: '/impact/method',

  /* 프로필 */
  ME: '/me',
  MY_ACTIVITIES: '/me/activities',
  ME_EDIT: '/me/edit',
  USER_PROFILE: '/users/:userId',

  /* 관리자 */
  ADMIN_LOGIN: '/admin/login',
  ADMIN_STATUS: '/admin/status',
} as const;

/** `/trades/:tradeId` 같은 패턴에 실제 id 를 채워 넣는다. */
export function buildPath(
  pattern: string,
  params: Record<string, string>,
): string {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodeURIComponent(value)),
    pattern,
  );
}

/* ─────────────────── 내비게이션 항목 ─────────────────── */

/** 아이콘은 shared/ui/icons 의 키. 렌더링 측에서 매핑한다. */
export type NavIconName =
  'home' | 'search' | 'plus' | 'handshake' | 'leaf' | 'user';

export interface NavItem {
  key: string;
  path: string;
  /** 모바일 하단 탭 라벨 (짧게) */
  mobileLabel: string;
  /** 데스크톱 사이드바 라벨 */
  desktopLabel: string;
  icon: NavIconName;
  /** 모바일 하단 탭에 노출할지 */
  inMobileTab: boolean;
  /** 데스크톱 사이드바에 노출할지 */
  inDesktopSidebar: boolean;
  /**
   * 활성 판정을 하위 경로까지 확장할지.
   * 예) /trades/123 에서도 '거래' 항목이 활성으로 보이게 한다.
   * 홈(`/`)은 완전 일치만 활성이어야 하므로 false.
   */
  matchNested: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    path: ROUTES.HOME,
    mobileLabel: '홈',
    desktopLabel: '홈',
    icon: 'home',
    inMobileTab: true,
    inDesktopSidebar: true,
    matchNested: false,
  },
  {
    key: 'search',
    path: ROUTES.SEARCH,
    mobileLabel: '검색',
    desktopLabel: '물품 탐색',
    icon: 'search',
    inMobileTab: true,
    inDesktopSidebar: true,
    matchNested: true,
  },
  {
    key: 'trade-new',
    path: ROUTES.TRADE_NEW,
    mobileLabel: '거래 등록',
    desktopLabel: '게시물 등록',
    icon: 'plus',
    inMobileTab: true,
    inDesktopSidebar: true,
    matchNested: false,
  },
  {
    key: 'rentals',
    path: ROUTES.RENTAL_LIST,
    mobileLabel: '대여 요청',
    desktopLabel: '대여 요청',
    icon: 'handshake',
    inMobileTab: true,
    inDesktopSidebar: true,
    matchNested: true,
  },
  {
    key: 'impact',
    path: ROUTES.IMPACT,
    mobileLabel: '임팩트',
    desktopLabel: '임팩트',
    icon: 'leaf',
    // 모바일 탭은 5칸이 한계라 임팩트는 빼고 홈 피드 카드에서 진입한다.
    inMobileTab: false,
    inDesktopSidebar: true,
    matchNested: true,
  },
  {
    key: 'me',
    path: ROUTES.ME,
    mobileLabel: '프로필',
    desktopLabel: '마이프로필',
    icon: 'user',
    inMobileTab: true,
    inDesktopSidebar: true,
    matchNested: true,
  },
];

export const MOBILE_TAB_ITEMS = NAV_ITEMS.filter((i) => i.inMobileTab);
export const DESKTOP_SIDEBAR_ITEMS = NAV_ITEMS.filter(
  (i) => i.inDesktopSidebar,
);

/** 현재 경로가 해당 내비 항목에 속하는지 판정한다. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (!item.matchNested) return pathname === item.path;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

/* ─────────────────── 레이아웃 상수 ─────────────────── */

/**
 * 반응형 분기는 `md`(768px) 하나만 쓴다.
 * 분기 지점을 늘리면 24시간 안에 감당이 안 된다.
 */
export const LAYOUT = {
  /** 데스크톱 본문 최대 폭 */
  contentMaxWidth: 'max-w-6xl',
  /** 상세 화면 최대 폭 (2단 분할은 하지 않는다) */
  detailMaxWidth: 'max-w-3xl',
  /** 목록 그리드 */
  listGrid: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4',
  rentalGrid: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
} as const;
