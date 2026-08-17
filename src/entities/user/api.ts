import { api } from '@/shared/api/client';

import type {
  LoginRequest,
  LoginResponse,
  MyProfile,
  PublicProfile,
} from './types';

export const userApi = {
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/api/v1/auth/login', body).then((r) => r.data),

  me: () => api.get<MyProfile>('/api/v1/users/me').then((r) => r.data),

  publicProfile: (userId: string) =>
    api.get<PublicProfile>(`/api/v1/users/${userId}`).then((r) => r.data),
};
