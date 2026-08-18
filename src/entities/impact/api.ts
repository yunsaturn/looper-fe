import { api } from '@/shared/api/client';

import type {
  CampusImpact,
  CarbonReferences,
  ImpactPeriodParams,
  MyImpact,
} from './types';

export const impactApi = {
  /** 기간을 주면 그 구간의 완료 활동만 합산한다. 없으면 전체 기간 */
  me: (params: ImpactPeriodParams = {}) =>
    api.get<MyImpact>('/api/v1/impact/me', { params }).then((r) => r.data),

  campus: (campusId: string, params: ImpactPeriodParams = {}) =>
    api
      .get<CampusImpact>(`/api/v1/impact/campuses/${campusId}`, { params })
      .then((r) => r.data),

  carbonReferences: () =>
    api.get<CarbonReferences>('/api/v1/carbon/references').then((r) => r.data),
};
