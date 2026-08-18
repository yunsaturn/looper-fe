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

/**
 * baseURL 을 정규화한다.
 *
 * 엔드포인트 함수들이 이미 `/api/v1/...` 로 시작하므로 baseURL 에는
 * 도메인만 들어가야 한다. 그런데 BE 쪽에서 공유하는 주소는 보통
 * `https://.../api/v1` 형태라 그대로 넣으면 `/api/v1/api/v1/trades` 가 된다.
 * 둘 중 어느 형태로 넣어도 동작하도록 뒤쪽 `/api/v1` 과 슬래시를 떼어낸다.
 */
function normalizeBaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v\d+$/, '');
}

const BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
);

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  /**
   * Render 무료 플랜은 15분 무요청 시 인스턴스를 재우고, 첫 요청에
   * 콜드 스타트로 1분 가까이 걸린다. 기본 15초로는 첫 요청이 반드시
   * 타임아웃되므로 넉넉하게 잡는다. (warmUpServer 로 미리 깨우긴 하지만
   * 그 사이에 사용자가 먼저 요청할 수 있다)
   */
  timeout: 70_000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * 서버를 미리 깨운다.
 *
 * 앱이 뜨는 순간 헬스체크를 한 번 던져 두면, 사용자가 로그인 화면을
 * 보는 동안 인스턴스가 기동한다. 실패해도 무시한다 — 깨우기용일 뿐이라
 * 화면 흐름에 영향을 주면 안 된다.
 */
export function warmUpServer(): void {
  if (import.meta.env.VITE_USE_MOCK === 'true') return;

  // 인터셉터를 타면 401 처리·에러 토스트가 걸리므로 별도 요청으로 보낸다
  void axios
    .get(`${BASE_URL}/actuator/health`, { timeout: 70_000 })
    .catch(() => undefined);
}

/* ─────────────────── 토큰 ─────────────────── */

const TOKEN_KEY = 'looper.access_token';
const REFRESH_KEY = 'looper.refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * Refresh Token 은 로그아웃 때 서버에 폐기를 요청하려고 보관한다.
 * Access Token 은 만료 전까지 자체적으로 유효하므로, 로그아웃 시
 * 서버 폐기와 별개로 **두 토큰을 모두 지워야** 한다. (BE 문서 명시)
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}

export function clearTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
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

    const apiError = new ApiError(
      error.response.status,
      error.response.data ?? {},
    );

    if (apiError.isUnauthorized) {
      clearTokens();
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
