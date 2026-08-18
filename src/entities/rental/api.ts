import { api, type PageResponse } from '@/shared/api/client';

import type {
  CreatedRental,
  CreateRentalRequest,
  RentalCancellationRequest,
  RentalDetail,
  RentalListFilters,
  RentalListItem,
  RentalOffer,
  RentalReturnRequest,
  UpdatedRental,
  UpdateRentalRequest,
} from './types';

const BASE = '/api/v1/rentals';

export const rentalApi = {
  list: (filters: RentalListFilters) =>
    api
      .get<PageResponse<RentalListItem>>(BASE, { params: filters })
      .then((r) => r.data),

  detail: (rentalId: string) =>
    api.get<RentalDetail>(`${BASE}/${rentalId}`).then((r) => r.data),

  create: (body: CreateRentalRequest) =>
    api.post<CreatedRental>(BASE, body).then((r) => r.data),

  /**
   * 대여 요청 삭제.
   *
   * ⚠️ 거래와 마찬가지로 아직 BE 에 없다.
   *    요청한 규격: DELETE /api/v1/rentals/{rentalId} → 204,
   *    요청자만 가능(403), RECRUITING 이 아니면 409.
   */
  remove: (rentalId: string) =>
    api.delete<void>(`${BASE}/${rentalId}`).then(() => undefined),

  /** RECRUITING 상태에서만 가능. 시간을 바꾸면 서버가 반납 예정 시각을 다시 계산한다 */
  update: (rentalId: string, body: UpdateRentalRequest) =>
    api.patch<UpdatedRental>(`${BASE}/${rentalId}`, body).then((r) => r.data),

  /* 지원 */
  offer: (rentalId: string, message: string) =>
    api
      .post<RentalOffer>(`${BASE}/${rentalId}/offers`, { message })
      .then((r) => r.data),

  offers: (rentalId: string) =>
    api
      .get<{ offers: RentalOffer[] }>(`${BASE}/${rentalId}/offers`)
      .then((r) => r.data.offers),

  selectOffer: (rentalId: string, offerId: string) =>
    api
      .post(`${BASE}/${rentalId}/offers/${offerId}/select`)
      .then((r) => r.data),

  cancelOffer: (
    rentalId: string,
    offerId: string,
    body: RentalCancellationRequest = {},
  ) =>
    api
      .post(`${BASE}/${rentalId}/offers/${offerId}/cancel`, body)
      .then((r) => r.data),

  /* 수령·반납 */
  confirmPickup: (rentalId: string) =>
    api.post(`${BASE}/${rentalId}/pickup/confirm`).then((r) => r.data),

  requestReturn: (rentalId: string, body: RentalReturnRequest = {}) =>
    api.post(`${BASE}/${rentalId}/return/request`, body).then((r) => r.data),

  confirmReturn: (rentalId: string) =>
    api.post(`${BASE}/${rentalId}/return/confirm`).then((r) => r.data),

  cancel: (rentalId: string, body: RentalCancellationRequest = {}) =>
    api.post(`${BASE}/${rentalId}/cancel`, body).then((r) => r.data),
};
