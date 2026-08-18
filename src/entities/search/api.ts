import { api } from '@/shared/api/client';

import type { SearchParams, SearchResponse } from './types';

export const searchApi = {
  search: (params: SearchParams) =>
    api.get<SearchResponse>('/api/v1/search', { params }).then((r) => r.data),
};
