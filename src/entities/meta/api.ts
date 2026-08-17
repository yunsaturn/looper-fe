import { api } from '@/shared/api/client';
import type { PickupZone } from '@/entities/trade/types';

export interface Campus {
  id: string;
  name: string;
}

export interface School {
  id: string;
  name: string;
  email_domain: string;
  campuses: Campus[];
}

export const metaApi = {
  /** 가입 가능 학교·캠퍼스 목록 */
  schools: () =>
    api
      .get<{ content: School[] }>('/api/v1/meta/schools')
      .then((r) => r.data.content),

  /** 캠퍼스별 픽업존. 거래·대여 등록 시 자유 입력이 아니라 이 목록에서 고른다 */
  pickupZones: (campusId: string) =>
    api
      .get<{ content: PickupZone[] }>(
        `/api/v1/campuses/${campusId}/pickup-zones`,
      )
      .then((r) => r.data.content),
};
