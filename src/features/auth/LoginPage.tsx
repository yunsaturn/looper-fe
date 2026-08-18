import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { userApi } from '@/entities/user/api';
import { ApiError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Field';

export function LoginPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);

  // 목업 모드에서만 데모 계정을 미리 채운다. 실서버에는 시드 계정이 없어
  // 이 값을 남겨두면 첫 로그인이 반드시 401 로 실패한다.
  const isMock = import.meta.env.VITE_USE_MOCK === 'true';
  const [email, setEmail] = useState(isMock ? 'demo@xx.ac.kr' : '');
  const [password, setPassword] = useState(isMock ? 'password' : '');

  const login = useMutation({
    mutationFn: () => userApi.login({ email, password }),
    onSuccess: (res) => {
      signIn(res);
      navigate(ROUTES.HOME, { replace: true });
    },
  });

  const error = login.error instanceof ApiError ? login.error : null;

  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="Looper 로고"
            className="mx-auto h-9 w-9 shrink-0 md:h-20 md:w-40"
          />
          <p className="mt-1.5 text-sm text-ink-500">
            <strong>루퍼</strong> - 같은 캠퍼스 안에서 물건을 순환시켜요
          </p>
        </div>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
        >
          <Input
            label="학교 이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@university.ac.kr"
            autoComplete="email"
            required
            error={error?.fieldError('email')}
          />
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            error={error?.fieldError('password')}
          />

          {error && !error.fieldErrors.length && (
            <p className="rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
              {error.message}
              {/* 서버가 1분 단위 고정 윈도로 로그인을 제한한다 */}
              {error.isRateLimited && ' 1분 뒤에 다시 시도해주세요.'}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth loading={login.isPending}>
            로그인
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          아직 계정이 없나요?{' '}
          <Link
            to={ROUTES.LANDING}
            className="font-semibold text-brand-700 underline"
          >
            회원가입
          </Link>
        </p>

        {isMock && (
          <p className="mt-8 rounded-card bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
            목업 모드입니다. 아무 값으로나 로그인됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
