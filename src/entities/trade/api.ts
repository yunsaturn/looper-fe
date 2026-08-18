import { api, type PageResponse } from '@/shared/api/client';

import type {
  AcceptApplicationRequest,
  CreatedTrade,
  CreateTradeRequest,
  TradeApplication,
  TradeDetail,
  TradeListFilters,
  TradeListItem,
  TradeCancellationRequest,
  UpdatedTrade,
  UpdateTradeRequest,
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
    api.post<CreatedTrade>(BASE, body).then((r) => r.data),

  /**
   * 게시물 삭제.
   *
   * ⚠️ 아직 BE 에 이 엔드포인트가 없다. 서버가 추가되기 전까지 실서버에서는
   *    404/405 가 돌아온다. 화면은 그 경우를 구분해 안내한다.
   *    요청한 규격: DELETE /api/v1/trades/{tradeId} → 204,
   *    작성자만 가능(403), AVAILABLE 이 아니면 409.
   */
  remove: (tradeId: string) =>
    api.delete<void>(`${BASE}/${tradeId}`).then(() => undefined),

  /** AVAILABLE 상태에서만 가능. 보낸 필드만 반영된다 */
  update: (tradeId: string, body: UpdateTradeRequest) =>
    api.patch<UpdatedTrade>(`${BASE}/${tradeId}`, body).then((r) => r.data),

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

  /** 수락과 거래 약속 확정이 한 번에 일어난다. 본문은 필수다 */
  acceptApplication: (
    tradeId: string,
    applicationId: string,
    body: AcceptApplicationRequest,
  ) =>
    api
      .post(`${BASE}/${tradeId}/applications/${applicationId}/accept`, body)
      .then((r) => r.data),

  cancelApplication: (
    tradeId: string,
    applicationId: string,
    body: TradeCancellationRequest = {},
  ) =>
    api
      .post(`${BASE}/${tradeId}/applications/${applicationId}/cancel`, body)
      .then((r) => r.data),

  /* 예약·완료 */
  cancelReservation: (tradeId: string, body: TradeCancellationRequest = {}) =>
    api.post(`${BASE}/${tradeId}/reservation/cancel`, body).then((r) => r.data),

  requestCompletion: (tradeId: string) =>
    api.post(`${BASE}/${tradeId}/completion/request`).then((r) => r.data),

  confirmCompletion: (tradeId: string) =>
    api.post(`${BASE}/${tradeId}/completion/confirm`).then((r) => r.data),
};
