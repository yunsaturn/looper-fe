import { Navigate, Route, Routes } from 'react-router-dom';

import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';

import { MainLayout } from './layouts/MainLayout';
import { StackLayout } from './layouts/StackLayout';

import { LoginPage } from '@/features/auth/LoginPage';
import { HomePage } from '@/features/home/HomePage';
import { TradeListPage } from '@/features/trade/TradeListPage';
import { TradeDetailPage } from '@/features/trade/TradeDetailPage';
import { TradeNewPage } from '@/features/trade/TradeNewPage';
import { TradeApplicantsPage } from '@/features/trade/TradeApplicantsPage';
import { TradeCompletePage } from '@/features/trade/TradeCompletePage';
import { RentalListPage } from '@/features/rent/RentalListPage';
import { RentalDetailPage } from '@/features/rent/RentalDetailPage';
import { RentalNewPage } from '@/features/rent/RentalNewPage';
import { RentalOffersPage } from '@/features/rent/RentalOffersPage';
import { RentalCompletePage } from '@/features/rent/RentalCompletePage';
import { ImpactPage } from '@/features/impact/ImpactPage';
import { ImpactMethodPage } from '@/features/impact/ImpactMethodPage';
import {
  NotFoundPage,
  PlaceholderPage,
} from '@/features/misc/PlaceholderPage';

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
export function AppRouter() {
  return (
    <Routes>
      {/* 공개 */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route
        path={ROUTES.SIGNUP}
        element={
          <PlaceholderPage
            title="회원가입"
            description="학교 이메일 인증 흐름은 실제 서버 연결 후 붙입니다."
          />
        }
      />

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
        <Route
          path={ROUTES.ME}
          element={<PlaceholderPage title="마이프로필" />}
        />
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
        <Route
          path={ROUTES.TRADE_EDIT}
          element={<PlaceholderPage title="게시물 수정" />}
        />

        {/* 대여 */}
        <Route path={ROUTES.RENTAL_NEW} element={<RentalNewPage />} />
        <Route path={ROUTES.RENTAL_DETAIL} element={<RentalDetailPage />} />
        <Route path={ROUTES.RENTAL_OFFERS} element={<RentalOffersPage />} />
        <Route path={ROUTES.RENTAL_COMPLETE} element={<RentalCompletePage />} />
        <Route
          path={ROUTES.RENTAL_EDIT}
          element={<PlaceholderPage title="대여 요청 수정" />}
        />

        {/* 임팩트 */}
        <Route path={ROUTES.IMPACT_METHOD} element={<ImpactMethodPage />} />
        <Route
          path={ROUTES.IMPACT_CAMPUS}
          element={<PlaceholderPage title="캠퍼스 대시보드" />}
        />

        {/* 프로필 */}
        <Route
          path={ROUTES.USER_PROFILE}
          element={<PlaceholderPage title="사용자 프로필" />}
        />
        <Route
          path={ROUTES.MY_TRADES}
          element={<PlaceholderPage title="나의 거래 목록" />}
        />

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
  );
}
