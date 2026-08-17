import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useNavigate } from 'react-router-dom';

import { ApiError } from '@/shared/api/errors';
import { setUnauthorizedHandler } from '@/shared/api/client';
import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { ToastProvider } from '@/shared/ui/Toast';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // 4xx 는 재시도해도 결과가 같다. 네트워크 오류만 한 번 더 시도한다.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 1;
        },
      },
      mutations: {
        // 상태 전이는 서버가 단일 출처다. 실패한 mutation 을 자동 재시도하면
        // 중복 수락·이중 완료 처리가 생길 수 있으므로 재시도하지 않는다. (R5)
        retry: false,
      },
    },
  });
}

/** 401 을 받으면 로그인 화면으로 보낸다. Router 안에서만 useNavigate 를 쓸 수 있다. */
function UnauthorizedRedirect() {
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
      navigate(ROUTES.LOGIN, { replace: true });
    });
  }, [navigate, signOut]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UnauthorizedRedirect />
        <ToastProvider>{children}</ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
