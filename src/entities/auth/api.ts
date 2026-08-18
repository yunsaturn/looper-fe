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
};
