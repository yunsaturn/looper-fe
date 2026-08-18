import { api } from '@/shared/api/client';

import type {
  LoginRequest,
  LoginResponse,
  MyProfile,
  PublicProfile,
  UpdatedProfile,
  UpdateProfileRequest,
} from './types';

export const userApi = {
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/api/v1/auth/login', body).then((r) => r.data),

  me: () => api.get<MyProfile>('/api/v1/users/me').then((r) => r.data),

  updateMe: (body: UpdateProfileRequest) =>
    api.patch<UpdatedProfile>('/api/v1/users/me', body).then((r) => r.data),

  publicProfile: (userId: string) =>
    api.get<PublicProfile>(`/api/v1/users/${userId}`).then((r) => r.data),
};
