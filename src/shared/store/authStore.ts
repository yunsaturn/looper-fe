import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  clearTokens,
  setAccessToken,
  setRefreshToken,
} from '@/shared/api/client';
import type { LoginResponse } from '@/entities/user/types';

/**
 * 인증 상태만 담는다. 서버 데이터(게시물·대여·임팩트)는 절대 넣지 않는다.
 * 그건 TanStack Query 가 단일 출처로 관리한다.
 */
interface AuthState {
  userId: string | null;
  nickname: string | null;
  campusId: string | null;
  trustScore: number | null;
  isAuthenticated: boolean;

  signIn: (res: LoginResponse) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      nickname: null,
      campusId: null,
      trustScore: null,
      isAuthenticated: false,

      signIn: (res) => {
        setAccessToken(res.access_token);
        // 로그아웃 때 서버에 폐기를 요청하려면 Refresh Token 이 필요하다
        setRefreshToken(res.refresh_token);
        set({
          userId: res.user.id,
          nickname: res.user.nickname,
          campusId: res.user.campus_id,
          trustScore: res.user.trust_score,
          isAuthenticated: true,
        });
      },

      /**
       * 로컬 세션만 정리한다. 서버의 Refresh Token 폐기는 useLogout 이
       * 맡는다 — 네트워크가 실패해도 로그아웃 자체는 반드시 성공해야 하므로
       * 두 관심사를 분리했다.
       */
      signOut: () => {
        clearTokens();
        set({
          userId: null,
          nickname: null,
          campusId: null,
          trustScore: null,
          isAuthenticated: false,
        });
      },
    }),
    { name: 'looper.auth' },
  ),
);
