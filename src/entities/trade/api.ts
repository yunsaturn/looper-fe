import { api, type PageResponse } from '@/shared/api/client';

import type {
  CreateTradeRequest,
  TradeApplication,
  TradeDetail,
  TradeListFilters,
  TradeListItem,
} from './types';

const BASE = '/api/v1/trades';

export const tradeApi = {
  list: (filters: TradeListFilters) =>
    api
      .get<PageResponse<TradeListItem>>(BASE, { params: filters })
      .then((r) => r.data),

  detail: (tradeId: string) =>
    api.get<TradeDetail>(`${BASE}/${tradeId}`).then((r) => r.data),

  create: (body: CreateTradeRequest) =>
    api.post<TradeDetail>(BASE, body).then((r) => r.data),

  /* 신청 */
  apply: (tradeId: string, message: string) =>
    api
      .post<TradeApplication>(`${BASE}/${tradeId}/applications`, { message })
      .then((r) => r.data),

  applications: (tradeId: string) =>
    api
      .get<{ applications: TradeApplication[] }>(
        `${BASE}/${tradeId}/applications`,
      )
      .then((r) => r.data.applications),

  acceptApplication: (tradeId: string, applicationId: string) =>
    api
      .post(`${BASE}/${tradeId}/applications/${applicationId}/accept`)
      .then((r) => r.data),

  cancelApplication: (tradeId: string, applicationId: string) =>
    api
      .post(`${BASE}/${tradeId}/applications/${applicationId}/cancel`)
      .then((r) => r.data),

  /* 예약·완료 */
  cancelReservation: (tradeId: string) =>
    api.post(`${BASE}/${tradeId}/reservation/cancel`).then((r) => r.data),

  requestCompletion: (tradeId: string) =>
    api.post(`${BASE}/${tradeId}/completion/request`).then((r) => r.data),

  confirmCompletion: (tradeId: string) =>
    api.post(`${BASE}/${tradeId}/completion/confirm`).then((r) => r.data),
};
