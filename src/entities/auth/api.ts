import { api } from '@/shared/api/client';

/** 1단계 — 인증번호 발송 */
export interface EmailVerificationCreated {
  verification_id: string;
  expires_in_seconds: number;
  message: string;
}

/** 2단계 — 인증번호 확인 */
export interface EmailVerificationConfirmed {
  /** 회원가입에 한 번만 쓸 수 있는 토큰 */
  verification_token: string;
  verified: boolean;
  expires_in_seconds: number;
}

export interface SignupRequest {
  verification_token: string;
  password: string;
  nickname: string;
  school_id: string;
  campus_id: string;
  department?: string;
  main_building?: string;
}

export interface PasswordResetRequest {
  /** 인증번호 확인으로 받은 1회용 토큰 */
  verification_token: string;
  new_password: string;
}

/**
 * 회원가입은 세 단계다.
 *   1. 학교 이메일로 인증번호 발송  → verification_id
 *   2. 인증번호 6자리 확인          → verification_token (1회용)
 *   3. 토큰 + 프로필로 가입          → 로그인과 같은 형태의 토큰 발급
 */
export const authApi = {
  requestEmailVerification: (email: string) =>
    api
      .post<EmailVerificationCreated>('/api/v1/auth/email-verifications', {
        email,
      })
      .then((r) => r.data),

  confirmEmailVerification: (verificationId: string, code: string) =>
    api
      .post<EmailVerificationConfirmed>(
        '/api/v1/auth/email-verifications/confirm',
        { verification_id: verificationId, code },
      )
      .then((r) => r.data),

  signup: (body: SignupRequest) =>
    api
      .post<import('@/entities/user/types').LoginResponse>(
        '/api/v1/auth/signup',
        body,
      )
      .then((r) => r.data),

  /*
   * 비밀번호 재설정도 같은 인증번호 흐름을 쓴다.
   *   1. 가입된 이메일로 재설정용 인증번호 발송 → verification_id
   *   2. confirmEmailVerification 으로 확인      → verification_token
   *   3. 토큰 + 새 비밀번호로 재설정
   * 2단계가 가입과 같은 API 라 화면도 그대로 재사용한다.
   */
  requestPasswordResetCode: (email: string) =>
    api
      .post<EmailVerificationCreated>('/api/v1/auth/password/reset-code', {
        email,
      })
      .then((r) => r.data),

  resetPassword: (body: PasswordResetRequest) =>
    api.post<void>('/api/v1/auth/password/reset', body).then(() => undefined),
};
