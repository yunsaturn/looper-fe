import { api, type PageResponse } from '@/shared/api/client';

import type {
  ActivityFilters,
  ActivityItem,
  LoginRequest,
  LoginResponse,
  MyProfile,
  PublicProfile,
  UpdatedProfile,
  UpdateProfileRequest,
  WithdrawalRequest,
  WithdrawalResult,
} from './types';

export const userApi = {
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/api/v1/auth/login', body).then((r) => r.data),

  /**
   * Refresh Token 을 폐기한다. 멱등이라 이미 폐기·만료된 값을 보내도 204 다.
   * Access Token 은 만료 전까지 자체적으로 유효하므로 저장한 토큰은
   * 호출 성공 여부와 무관하게 클라이언트가 지워야 한다.
   */
  logout: (refreshToken: string) =>
    api
      .post<void>('/api/v1/auth/logout', { refresh_token: refreshToken })
      .then(() => undefined),

  me: () => api.get<MyProfile>('/api/v1/users/me').then((r) => r.data),

  updateMe: (body: UpdateProfileRequest) =>
    api.patch<UpdatedProfile>('/api/v1/users/me', body).then((r) => r.data),

  /** 회원 탈퇴. 진행 중인 거래·대여가 있으면 서버가 409 로 막는다 */
  withdraw: (body: WithdrawalRequest) =>
    api
      .delete<WithdrawalResult>('/api/v1/users/me', { data: body })
      .then((r) => r.data),

  /** 작성·신청한 거래와 요청·지원한 대여를 한 페이지로 합쳐 조회한다 */
  activities: (filters: ActivityFilters = {}) =>
    api
      .get<PageResponse<ActivityItem>>('/api/v1/users/me/activities', {
        params: filters,
      })
      .then((r) => r.data),

  publicProfile: (userId: string) =>
    api.get<PublicProfile>(`/api/v1/users/${userId}`).then((r) => r.data),
};
