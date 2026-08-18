import { useQuery } from '@tanstack/react-query';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { cn } from '@/shared/lib/cn';
import {
  DESKTOP_SIDEBAR_ITEMS,
  isNavItemActive,
  LAYOUT,
  MOBILE_TAB_ITEMS,
  ROUTES,
} from '@/shared/config/navigation';
import { RouteErrorBoundary } from '@/app/ErrorBoundary';
import { NavIcon, SearchIcon } from '@/shared/ui/icons';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { Avatar } from '@/shared/ui/Avatar';
import { userApi } from '@/entities/user/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * 메인 레이아웃 — Figma 와이어프레임 기준.
 *
 *   모바일  상단 간단 헤더 + 하단 탭 5개
 *   데스크톱 상단 헤더(로고·검색·등록·아바타) + 좌측 사이드바 6개
 *
 * 반응형 분기는 `md`(768px) 하나만 쓴다.
 */
export function MainLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-white">
      <TopHeader />

      <div className={cn('mx-auto flex w-full gap-8', LAYOUT.contentMaxWidth)}>
        <DesktopSidebar />

        <main className="min-w-0 grow px-4 py-5 pb-tabbar md:px-0 md:py-8">
          {/* 한 화면이 터져도 내비게이션은 살아 있어야 다른 곳으로 이동할 수 있다 */}
          <RouteErrorBoundary pathname={pathname}>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}

function TopHeader() {
  const navigate = useNavigate();

  /*
   * 아바타는 authStore 가 아니라 서버 프로필을 읽는다.
   * 로그인 응답에는 프로필 사진이 없어서 authStore 만 보면 사진을 바꿔도
   * 헤더가 그대로다. 프로필 수정 후 queryKeys.me 를 무효화하면 이 쿼리도
   * 같이 갱신되므로 두 화면이 어긋나지 않는다. (기획서 R5)
   */
  const me = useQuery({ queryKey: queryKeys.me, queryFn: userApi.me });

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div
        className={cn(
          'mx-auto flex h-14 w-full items-center gap-3 px-4 md:h-16 md:px-6',
          LAYOUT.contentMaxWidth,
        )}
      >
        <Link
          to={ROUTES.HOME}
          className="flex items-center text-lg font-bold text-brand-700"
          aria-label="루퍼 홈"
        >
          <BrandLogo size="sm" className="shrink-0" />
        </Link>

        {/* 데스크톱에만 헤더 검색창을 둔다. 모바일은 검색 탭이 따로 있다. */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.SEARCH)}
          className="ml-auto hidden h-10 w-64 items-center gap-2 rounded-btn border border-ink-200 px-3 text-sm text-ink-400 hover:border-ink-300 md:flex"
        >
          <SearchIcon className="h-4 w-4" />
          물건 이름, 카테고리로 검색
        </button>

        <Link
          to={ROUTES.TRADE_NEW}
          className="ml-auto hidden text-sm font-semibold text-ink-700 hover:text-brand-700 md:ml-0 md:block"
        >
          게시물 등록
        </Link>

        <Link
          to={ROUTES.ME}
          aria-label="마이프로필"
          className="ml-auto md:ml-0"
        >
          <Avatar
            nickname={me.data?.nickname}
            imageUrl={me.data?.profile_image_url}
            className="h-9 w-9 text-sm"
          />
        </Link>
      </div>
    </header>
  );
}

function DesktopSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden w-52 shrink-0 rounded-card bg-gray-50 px-3 py-6 md:mt-6 md:block">
      <p className="px-3 pb-2 text-xs font-semibold text-ink-400">메뉴</p>
      <nav className="grid gap-0.5">
        {DESKTOP_SIDEBAR_ITEMS.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.key}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-btn px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-brand-50 font-semibold text-brand-700'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              {item.desktopLabel}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileTabBar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white pb-safe md:hidden">
      <ul className="flex h-16 items-stretch">
        {MOBILE_TAB_ITEMS.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <li key={item.key} className="flex-1">
              <NavLink
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors',
                  active ? 'font-semibold text-brand-600' : 'text-ink-400',
                )}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                {item.mobileLabel}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
