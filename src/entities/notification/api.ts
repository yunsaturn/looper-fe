import { api, type PageResponse } from '@/shared/api/client';

import type {
  NotificationFilters,
  NotificationItem,
  ReadAllResult,
  ReadResult,
  UnreadCount,
} from './types';

const BASE = '/api/v1/notifications';

export const notificationApi = {
  list: (filters: NotificationFilters = {}) =>
    api
      .get<PageResponse<NotificationItem>>(BASE, { params: filters })
      .then((r) => r.data),

  /** 헤더 배지용. 목록보다 가벼워 자주 불러도 된다 */
  unreadCount: () =>
    api.get<UnreadCount>(`${BASE}/unread-count`).then((r) => r.data),

  markRead: (notificationId: string) =>
    api.patch<ReadResult>(`${BASE}/${notificationId}/read`).then((r) => r.data),

  markAllRead: () =>
    api.patch<ReadAllResult>(`${BASE}/read-all`).then((r) => r.data),
};
