import { api } from '@/shared/api/client';

import type {
  ConditionAfterRequest,
  ConditionAfterResponse,
  ConditionBeforeRequest,
  CreateReportRequest,
  RentalReport,
  SafetyInfo,
} from './types';

const base = (rentalId: string) => `/api/v1/rentals/${rentalId}`;

export const rentalSafetyApi = {
  get: (rentalId: string) =>
    api.get<SafetyInfo>(`${base(rentalId)}/safety`).then((r) => r.data),

  registerBefore: (rentalId: string, body: ConditionBeforeRequest) =>
    api
      .post<ConditionPhotosResponse>(
        `${base(rentalId)}/safety/condition/before`,
        body,
      )
      .then((r) => r.data),

  acceptCondition: (rentalId: string) =>
    api
      .post<{ status: string }>(`${base(rentalId)}/safety/condition/accept`)
      .then((r) => r.data),

  registerAfter: (rentalId: string, body: ConditionAfterRequest) =>
    api
      .post<ConditionAfterResponse>(
        `${base(rentalId)}/safety/condition/after`,
        body,
      )
      .then((r) => r.data),

  approveReturn: (rentalId: string) =>
    api
      .post<{ status: string }>(`${base(rentalId)}/safety/return/approve`)
      .then((r) => r.data),

  createReport: (rentalId: string, body: CreateReportRequest) =>
    api
      .post<RentalReport>(`${base(rentalId)}/reports`, body)
      .then((r) => r.data),
};

interface ConditionPhotosResponse {
  image_urls: string[];
  registered_at: string;
}
