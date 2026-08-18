import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { userApi } from '@/entities/user/api';
import { getRefreshToken } from '@/shared/api/client';
import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';

/**
 * 로그아웃.
 *
 * 서버에 Refresh Token 폐기를 요청한 뒤 로컬 세션을 정리한다.
 *
 * ⚠️ **네트워크가 실패해도 로그아웃은 성공해야 한다.** 공용 PC 에서
 *    로그아웃이 안 되는 상황이 서버 오류보다 훨씬 위험하다. 그래서 API
 *    실패를 삼키고 로컬 정리와 화면 이동은 항상 수행한다. 서버 폐기가
 *    안 됐더라도 저장한 토큰이 사라지므로 이 브라우저에서는 쓸 수 없다.
 *
 * 캐시도 함께 비운다. 안 그러면 다음 사용자가 로그인했을 때 이전 사용자의
 * 목록·프로필이 한 프레임 스쳐 지나간다.
 */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signOut = useAuthStore((s) => s.signOut);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return;
      try {
        await userApi.logout(refreshToken);
      } catch {
        // 서버 폐기 실패는 로그아웃을 막지 않는다
      }
    },
    onSettled: () => {
      signOut();
      queryClient.clear();
      navigate(ROUTES.LOGIN, { replace: true });
    },
  });
}
