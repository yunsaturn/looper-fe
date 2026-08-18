import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '@/entities/auth/api';
import { metaApi } from '@/entities/meta/api';
import { ApiError } from '@/shared/api/errors';
import { queryKeys } from '@/shared/api/queryKeys';
import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { Button } from '@/shared/ui/Button';
import { Input, Select } from '@/shared/ui/Field';
import { userApi } from '@/entities/user/api';
import { STUDENT_YEAR_MAX, STUDENT_YEAR_MIN } from '@/entities/user/types';
import { BrandLogo } from '@/shared/ui/BrandLogo';

/**
 * 학교 이메일 회원가입 — 3단계.
 *
 *   1. 이메일 입력 → 인증번호 발송
 *   2. 인증번호 6자리 확인 → 1회용 verification_token
 *   3. 비밀번호·닉네임·학교·캠퍼스 입력 → 가입 완료 후 바로 로그인 상태
 *
 * 서버에 시드 계정이 없으므로 실서버에서는 이 화면을 거쳐야 로그인할 수 있다.
 */

type Step = 'email' | 'code' | 'profile';

/** BE SignupRequest 의 비밀번호 정책과 동일하게 맞춘다 */
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

/** 서버가 받는 1~8 을 그대로 선택지로 만든다 */
const STUDENT_YEAR_OPTIONS = Array.from(
  { length: STUDENT_YEAR_MAX - STUDENT_YEAR_MIN + 1 },
  (_, i) => {
    const year = STUDENT_YEAR_MIN + i;
    return { value: String(year), label: `${year}학년` };
  },
);

export function SignupPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [studentYear, setStudentYear] = useState('');
  const [nickname, setNickname] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [campusId, setCampusId] = useState('');
  const [department, setDepartment] = useState('');

  const schools = useQuery({
    queryKey: queryKeys.schools,
    queryFn: metaApi.schools,
    // 전국 학교 목록이라 응답이 크다. 화면에 있는 동안 다시 받지 않는다.
    staleTime: Infinity,
  });

  /** 이메일 도메인으로 학교를 좁혀 준다 — 전국 목록에서 직접 찾기는 번거롭다 */
  const emailDomain = email.split('@')[1]?.toLowerCase() ?? '';
  const matchedSchools = useMemo(() => {
    const all = schools.data ?? [];
    if (!emailDomain) return all;
    const matched = all.filter((s) =>
      s.email_domains.some((d) => d.toLowerCase() === emailDomain),
    );
    return matched.length > 0 ? matched : all;
  }, [schools.data, emailDomain]);

  const campuses =
    matchedSchools.find((s) => s.id === schoolId)?.campuses ?? [];

  const sendCode = useMutation({
    mutationFn: () => authApi.requestEmailVerification(email),
    onSuccess: (res) => {
      setVerificationId(res.verification_id);
      setStep('code');
    },
  });

  const confirmCode = useMutation({
    mutationFn: () => authApi.confirmEmailVerification(verificationId, code),
    onSuccess: (res) => {
      setVerificationToken(res.verification_token);
      // 도메인이 일치하는 학교가 하나뿐이면 미리 골라 둔다
      if (matchedSchools.length === 1) setSchoolId(matchedSchools[0].id);
      setStep('profile');
    },
  });

  const signup = useMutation({
    mutationFn: async () => {
      const res = await authApi.signup({
        verification_token: verificationToken,
        password,
        nickname,
        school_id: schoolId,
        campus_id: campusId,
        department: department || undefined,
      });

      /*
       * 학년은 가입 요청이 받지 않는 값이라(서버 SignupRequest 에 없다)
       * 가입 직후 프로필 수정으로 반영한다. 여기서 실패해도 계정은 이미
       * 만들어졌으므로 가입 자체를 되돌리지 않는다 — 마이프로필에서
       * 언제든 다시 채울 수 있다.
       */
      if (studentYear) {
        signIn(res);
        try {
          await userApi.updateMe({ student_year: Number(studentYear) });
        } catch {
          // 학년은 부가 정보라 실패를 사용자에게 알리지 않는다
        }
      }
      return res;
    },
    onSuccess: (res) => {
      signIn(res);
      navigate(ROUTES.HOME, { replace: true });
    },
  });

  const active =
    step === 'email' ? sendCode : step === 'code' ? confirmCode : signup;
  const error = active.error instanceof ApiError ? active.error : null;

  const passwordValid = PASSWORD_RULE.test(password);
  // 재입력이 어긋난 채로 가입되면 다음 로그인에서야 알게 된다. 미리 막는다
  const passwordMismatch =
    passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-7 text-center">
          <BrandLogo />
          <h1 className="mt-3 text-xl font-bold text-ink-900">회원가입</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            학교 이메일로 같은 캠퍼스 구성원임을 확인해요
          </p>
        </div>

        <ol className="mb-6 flex gap-1.5" aria-label="가입 진행 단계">
          {(['email', 'code', 'profile'] as const).map((s, i) => (
            <li
              key={s}
              className={`h-1 flex-1 rounded-chip ${
                ['email', 'code', 'profile'].indexOf(step) >= i
                  ? 'bg-brand-500'
                  : 'bg-ink-200'
              }`}
            />
          ))}
        </ol>

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
              hint="가입 가능한 학교 이메일이어야 해요."
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
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
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
              onClick={() => {
                setCode('');
                setStep('email');
              }}
            >
              이메일 다시 입력
            </Button>
          </form>
        )}

        {step === 'profile' && (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              signup.mutate();
            }}
          >
            <Input
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              hint="영문·숫자·특수문자를 포함해 8자 이상"
              error={
                password && !passwordValid
                  ? '영문, 숫자, 특수문자를 모두 포함해 8자 이상이어야 해요.'
                  : error?.fieldError('password')
              }
            />
            <Input
              label="비밀번호 확인"
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
            <Input
              label="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="캠퍼스루퍼"
              minLength={2}
              maxLength={30}
              required
              hint="공개되는 정보는 닉네임, 학교, 캠퍼스, 신뢰도뿐이에요."
              error={error?.fieldError('nickname')}
            />
            <Select
              label="학교"
              value={schoolId}
              onChange={(e) => {
                setSchoolId(e.target.value);
                setCampusId('');
              }}
              options={matchedSchools.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              placeholder={
                schools.isPending ? '불러오는 중...' : '학교를 선택하세요'
              }
              required
              error={error?.fieldError('school_id')}
            />
            <Select
              label="캠퍼스"
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              options={campuses.map((c) => ({
                value: c.id,
                label: c.region_name ? `${c.name} (${c.region_name})` : c.name,
              }))}
              placeholder={
                schoolId ? '캠퍼스를 선택하세요' : '학교를 먼저 선택하세요'
              }
              disabled={!schoolId}
              required
              error={error?.fieldError('campus_id')}
            />
            <Input
              label="학과 (선택)"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="컴퓨터공학과"
              maxLength={100}
            />
            <Select
              label="학년 (선택)"
              value={studentYear}
              onChange={(e) => setStudentYear(e.target.value)}
              options={STUDENT_YEAR_OPTIONS}
              placeholder="선택하지 않음"
            />

            <p className="rounded-btn bg-ink-50 px-3 py-2.5 text-xs leading-relaxed text-ink-500">
              가입하면 루퍼 이용약관과 개인정보 처리방침에 동의합니다.
            </p>
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={signup.isPending}
              disabled={
                !passwordValid ||
                passwordMismatch ||
                !passwordConfirm ||
                !campusId
              }
            >
              가입하고 시작하기
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
          이미 계정이 있나요?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-semibold text-brand-700 underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
