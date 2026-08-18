import { api } from '@/shared/api/client';
import type { PickupZone } from '@/entities/trade/types';

export interface CampusItem {
  id: string;
  name: string;
  region_name: string | null;
  address: string | null;
}

export interface SchoolItem {
  id: string;
  name: string;
  /** 호환용 대표 도메인. 신규 구현은 email_domains 를 쓴다 */
  email_domain: string;
  email_domains: string[];
  /** false 면 캠퍼스 정보는 있지만 이메일 가입은 아직 안 된다 */
  email_verification_enabled: boolean;
  campuses: CampusItem[];
}

export const metaApi = {
  /** 전국 학교·캠퍼스·이메일 도메인. 인증 없이 호출 가능 */
  schools: () =>
    api
      .get<{ schools: SchoolItem[] }>('/api/v1/meta/schools')
      .then((r) => r.data.schools),

  /** 캠퍼스별 픽업존. 거래·대여 등록 시 자유 입력이 아니라 이 목록에서 고른다 */
  pickupZones: (campusId: string) =>
    api
      .get<{ pickup_zones: PickupZone[] }>(
        `/api/v1/campuses/${campusId}/pickup-zones`,
      )
      .then((r) => r.data.pickup_zones),
};
