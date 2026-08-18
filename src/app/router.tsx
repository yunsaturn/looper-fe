import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { Skeleton } from '@/shared/ui/feedback';

import { MainLayout } from './layouts/MainLayout';
import { StackLayout } from './layouts/StackLayout';

/*
 * 로그인·홈은 즉시 필요하므로 정적 import 로 둔다.
 * 나머지 화면은 lazy 로 쪼갠다 — 첫 진입에 거래 등록 폼이나 대여 흐름까지
 * 내려받을 이유가 없다. Render 콜드 스타트를 기다리는 동안 첫 화면이라도
 * 빨리 떠야 시연이 매끄럽다.
 */
import { LandingPage } from '@/features/auth/LandingPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { HomePage } from '@/features/home/HomePage';
import { NotFoundPage, PlaceholderPage } from '@/features/misc/PlaceholderPage';

const PasswordResetPage = lazyPage(
  () => import('@/features/auth/PasswordResetPage'),
  'PasswordResetPage',
);
const SignupPage = lazyPage(
  () => import('@/features/auth/SignupPage'),
  'SignupPage',
);
const TradeListPage = lazyPage(
  () => import('@/features/trade/TradeListPage'),
  'TradeListPage',
);
const TradeDetailPage = lazyPage(
  () => import('@/features/trade/TradeDetailPage'),
  'TradeDetailPage',
);
const TradeNewPage = lazyPage(
  () => import('@/features/trade/TradeNewPage'),
  'TradeNewPage',
);
const TradeApplicantsPage = lazyPage(
  () => import('@/features/trade/TradeApplicantsPage'),
  'TradeApplicantsPage',
);
const TradeEditPage = lazyPage(
  () => import('@/features/trade/TradeEditPage'),
  'TradeEditPage',
);
const TradeCompletePage = lazyPage(
  () => import('@/features/trade/TradeCompletePage'),
  'TradeCompletePage',
);
const RentalListPage = lazyPage(
  () => import('@/features/rent/RentalListPage'),
  'RentalListPage',
);
const RentalDetailPage = lazyPage(
  () => import('@/features/rent/RentalDetailPage'),
  'RentalDetailPage',
);
const RentalNewPage = lazyPage(
  () => import('@/features/rent/RentalNewPage'),
  'RentalNewPage',
);
const RentalOffersPage = lazyPage(
  () => import('@/features/rent/RentalOffersPage'),
  'RentalOffersPage',
);
const RentalEditPage = lazyPage(
  () => import('@/features/rent/RentalEditPage'),
  'RentalEditPage',
);
const RentalCompletePage = lazyPage(
  () => import('@/features/rent/RentalCompletePage'),
  'RentalCompletePage',
);
const ImpactPage = lazyPage(
  () => import('@/features/impact/ImpactPage'),
  'ImpactPage',
);
const ImpactMethodPage = lazyPage(
  () => import('@/features/impact/ImpactMethodPage'),
  'ImpactMethodPage',
);
const MyProfilePage = lazyPage(
  () => import('@/features/profile/MyProfilePage'),
  'MyProfilePage',
);
const MyActivitiesPage = lazyPage(
  () => import('@/features/profile/MyActivitiesPage'),
  'MyActivitiesPage',
);
const PublicProfilePage = lazyPage(
  () => import('@/features/profile/PublicProfilePage'),
  'PublicProfilePage',
);

/**
 * 화면은 전부 named export 라 React.lazy 가 기대하는 default 로 바꿔준다.
 * (named export 를 유지하는 편이 자동완성·리팩터링에 유리하다)
 */
function lazyPage<K extends string>(
  load: () => Promise<Record<K, React.ComponentType>>,
  name: K,
) {
  return lazy(() => load().then((m) => ({ default: m[name] })));
}

/** 로그인하지 않았으면 로그인 화면으로 보낸다. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
}

/**
 * 라우트는 화면 구현 여부와 무관하게 전부 선언해 둔다.
 * 미구현 화면은 PlaceholderPage 로 연결해 링크가 깨지지 않게 한다.
 *
 *   MainLayout   하단 탭/사이드바가 있는 최상위 화면
 *   StackLayout  흐름 안으로 들어가는 상세·등록 화면 (뒤로가기 헤더)
 */
/** lazy 청크를 받는 동안 레이아웃이 무너지지 않도록 자리만 잡아 둔다 */
function PageFallback() {
  return (
    <div className="grid gap-3" aria-busy="true">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* 공개 */}
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.PASSWORD_RESET} element={<PasswordResetPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

        {/* 탭이 있는 메인 화면 */}
        <Route
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.SEARCH} element={<TradeListPage />} />
          <Route path={ROUTES.TRADE_LIST} element={<TradeListPage />} />
          <Route path={ROUTES.RENTAL_LIST} element={<RentalListPage />} />
          <Route path={ROUTES.IMPACT} element={<ImpactPage />} />
          <Route path={ROUTES.ME} element={<MyProfilePage />} />
        </Route>

        {/* 흐름 안으로 들어가는 화면 */}
        <Route
          element={
            <RequireAuth>
              <StackLayout />
            </RequireAuth>
          }
        >
          {/* 거래 — /trades/new 가 /trades/:tradeId 보다 먼저 와야 한다 */}
          <Route path={ROUTES.TRADE_NEW} element={<TradeNewPage />} />
          <Route path={ROUTES.TRADE_DETAIL} element={<TradeDetailPage />} />
          <Route
            path={ROUTES.TRADE_APPLICANTS}
            element={<TradeApplicantsPage />}
          />
          <Route path={ROUTES.TRADE_COMPLETE} element={<TradeCompletePage />} />
          <Route path={ROUTES.TRADE_EDIT} element={<TradeEditPage />} />

          {/* 대여 */}
          <Route path={ROUTES.RENTAL_NEW} element={<RentalNewPage />} />
          <Route path={ROUTES.RENTAL_DETAIL} element={<RentalDetailPage />} />
          <Route path={ROUTES.RENTAL_OFFERS} element={<RentalOffersPage />} />
          <Route
            path={ROUTES.RENTAL_COMPLETE}
            element={<RentalCompletePage />}
          />
          <Route path={ROUTES.RENTAL_EDIT} element={<RentalEditPage />} />

          {/* 임팩트 */}
          <Route path={ROUTES.IMPACT_METHOD} element={<ImpactMethodPage />} />
          <Route
            path={ROUTES.IMPACT_CAMPUS}
            element={<PlaceholderPage title="캠퍼스 대시보드" />}
          />

          {/* 프로필 */}
          <Route path={ROUTES.USER_PROFILE} element={<PublicProfilePage />} />
          <Route path={ROUTES.MY_ACTIVITIES} element={<MyActivitiesPage />} />

          {/*
          관리자 — BE 에 관련 API 가 없어 MSW 목업으로만 붙일 예정이다.
          우선순위 최하위(P3)로 두고 핵심 흐름을 먼저 완성한다.
        */}
          <Route
            path={ROUTES.ADMIN_LOGIN}
            element={
              <PlaceholderPage
                title="관리자 로그인"
                description="BE 에 관리자 API 가 없어 목업으로 구현할 예정입니다."
              />
            }
          />
          <Route
            path={ROUTES.ADMIN_STATUS}
            element={
              <PlaceholderPage
                title="운영 상태 대시보드"
                description="BE 에 관리자 API 가 없어 목업으로 구현할 예정입니다."
              />
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
