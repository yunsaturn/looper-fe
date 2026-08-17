import { api } from '@/shared/api/client';

import type { CampusImpact, CarbonReferences, MyImpact } from './types';

export const impactApi = {
  me: () => api.get<MyImpact>('/api/v1/impact/me').then((r) => r.data),

  campus: (campusId: string) =>
    api
      .get<CampusImpact>(`/api/v1/impact/campuses/${campusId}`)
      .then((r) => r.data),

  carbonReferences: () =>
    api.get<CarbonReferences>('/api/v1/carbon/references').then((r) => r.data),
};
