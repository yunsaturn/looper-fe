import axios, { AxiosError, type AxiosInstance } from 'axios';

import { ApiError, type ApiErrorBody } from './errors';

/**
 * Spring Boot API 클라이언트.
 *
 * 프론트는 이 인스턴스로만 통신한다. AI 서비스(FastAPI)는 Private 이라
 * Spring Boot 만 접근할 수 있으므로 절대 직접 호출하지 않는다.
 *
 * BE 는 Jackson SNAKE_CASE 이므로 요청·응답 필드가 모두 snake_case 다.
 * 타입 정의(entities/*)도 snake_case 를 그대로 쓴다 — 변환 계층을 두면
 * 서버 명세와 코드가 어긋났을 때 추적이 어려워진다.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/* ─────────────────── 토큰 ─────────────────── */

const TOKEN_KEY = 'looper.access_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/* ─────────────────── 인터셉터 ─────────────────── */

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** 401 을 만났을 때 로그인 화면으로 보내는 콜백. providers 에서 주입한다. */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    // 응답을 받지 못한 경우(네트워크 장애·타임아웃)는 status 0 으로 정규화한다.
    if (!error.response) {
      return Promise.reject(
        new ApiError(0, {
          code: 'NETWORK_ERROR',
          message: '서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.',
        }),
      );
    }

    const apiError = new ApiError(error.response.status, error.response.data ?? {});

    if (apiError.isUnauthorized) {
      setAccessToken(null);
      onUnauthorized?.();
    }

    return Promise.reject(apiError);
  },
);

/* ─────────────────── 공통 응답 형태 ─────────────────── */

/** BE 의 PageResponse. 목록 조회는 전부 이 형태다. */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  has_next: boolean;
}

/** 목록 조회 공통 쿼리 파라미터 */
export interface PageParams {
  page?: number;
  size?: number;
}
