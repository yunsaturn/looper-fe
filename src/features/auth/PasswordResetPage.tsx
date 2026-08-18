import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '@/entities/auth/api';
import { ApiError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/config/navigation';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Field';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { useToast } from '@/shared/ui/useToast';

/**
 * 비밀번호 재설정.
 *
 * 가입과 같은 인증번호 흐름을 쓴다 — 이메일로 6자리를 받고, 확인 API 가
 * 1회용 토큰을 주고, 그 토큰으로 새 비밀번호를 설정한다. 2단계는 가입과
 * 완전히 같은 API 라 서버에서도 코드가 공유된다.
 */
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

type Step = 'email' | 'code' | 'password';

export function PasswordResetPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const sendCode = useMutation({
    mutationFn: () => authApi.requestPasswordResetCode(email),
    onSuccess: (res) => {
      setVerificationId(res.verification_id);
      setStep('code');
    },
  });

  const confirmCode = useMutation({
    mutationFn: () => authApi.confirmEmailVerification(verificationId, code),
    onSuccess: (res) => {
      setVerificationToken(res.verification_token);
      setStep('password');
    },
  });

  const reset = useMutation({
    mutationFn: () =>
      authApi.resetPassword({
        verification_token: verificationToken,
        new_password: password,
      }),
    onSuccess: () => {
      toast.show(
        '비밀번호를 바꿨어요. 새 비밀번호로 로그인해주세요.',
        'success',
      );
      navigate(ROUTES.LOGIN, { replace: true });
    },
  });

  const active =
    step === 'email' ? sendCode : step === 'code' ? confirmCode : reset;
  const error = active.error instanceof ApiError ? active.error : null;

  const passwordValid = PASSWORD_RULE.test(password);
  const passwordMismatch =
    passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-7 text-center">
          <BrandLogo />
          <h1 className="mt-3 text-xl font-bold text-ink-900">
            비밀번호 재설정
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            가입한 학교 이메일로 인증번호를 보내드려요
          </p>
        </div>

        {step === 'email' && (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              sendCode.mutate();
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
              hint="가입할 때 쓴 이메일이어야 해요."
              error={error?.fieldError('email')}
            />
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={sendCode.isPending}
            >
              인증번호 받기
            </Button>
          </form>
        )}

        {step === 'code' && (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              confirmCode.mutate();
            }}
          >
            <p className="rounded-btn bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
              {email} 으로 인증번호를 보냈어요. 5분 안에 입력해주세요.
            </p>
            <Input
              label="인증번호 6자리"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              required
              error={error?.fieldError('code')}
            />
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={confirmCode.isPending}
              disabled={code.length !== 6}
            >
              확인
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setStep('email')}
            >
              이메일 다시 입력
            </Button>
          </form>
        )}

        {step === 'password' && (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              reset.mutate();
            }}
          >
            <Input
              label="새 비밀번호"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              hint="영문·숫자·특수문자를 포함해 8자 이상"
              error={
                password && !passwordValid
                  ? '영문, 숫자, 특수문자를 모두 포함해 8자 이상이어야 해요.'
                  : error?.fieldError('new_password')
              }
            />
            <Input
              label="새 비밀번호 확인"
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              required
              error={passwordMismatch ? '비밀번호가 서로 달라요.' : undefined}
              hint={
                !passwordMismatch && passwordConfirm && passwordValid
                  ? '두 비밀번호가 일치해요.'
                  : undefined
              }
            />
            <label className="-mt-2 flex items-center gap-2 text-sm text-ink-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 accent-brand-500"
              />
              비밀번호 보기
            </label>
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={reset.isPending}
              disabled={!passwordValid || passwordMismatch || !passwordConfirm}
            >
              비밀번호 바꾸기
            </Button>
          </form>
        )}

        {error && !error.fieldErrors.length && (
          <p className="mt-4 rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
            {error.message}
            {error.isRateLimited && ' 잠시 후 다시 시도해주세요.'}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-ink-500">
          <Link to={ROUTES.LOGIN} className="underline hover:text-ink-700">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
