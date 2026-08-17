import type { Category } from '@/shared/config/categories';
import type { OfferStatus, RentalStatus } from '@/shared/config/status';
import type { UserSummary } from '@/entities/user/types';
import type { PickupZone } from '@/entities/trade/types';

/** 목록 아이템 (GET /api/v1/rentals). 기본 정렬은 start_at 오름차순 */
export interface RentalListItem {
  id: string;
  item_name: string;
  category: Category;
  start_at: string;
  due_at: string;
  pickup_zone_name: string;
  offered_price: number;
  status: RentalStatus;
  /** 상태와 독립된 플래그. status=IN_USE + is_overdue=true 조합이 존재한다 */
  is_overdue: boolean;
  requester: UserSummary;
  offer_count?: number;
}

/** 상세 (GET /api/v1/rentals/{rentalId}) */
export interface RentalDetail {
  id: string;
  item_name: string;
  category: Category;
  description: string;
  pickup_zone: PickupZone;
  start_at: string;
  due_at: string;
  offered_price: number;
  status: RentalStatus;
  is_overdue: boolean;
  overdue_at: string | null;
  requester: UserSummary;
  /** 내가 낸 지원의 상태. 지원한 적 없으면 null */
  my_offer_status: OfferStatus | null;
  /** 서버가 판단한 지원 가능 여부 */
  can_offer: boolean;
}

export interface RentalOffer {
  id: string;
  rental_id: string;
  offerer: UserSummary;
  message: string | null;
  status: OfferStatus;
  created_at: string;
}

export interface RentalListFilters {
  keyword?: string;
  category?: Category;
  status?: RentalStatus;
  is_overdue?: boolean;
  start_from?: string;
  pickup_zone_id?: string;
  page?: number;
  size?: number;
}

export interface CreateRentalRequest {
  item_name: string;
  category: Category;
  description: string;
  pickup_zone_id: string;
  start_at: string;
  /** 사용 시간(분). 서버가 due_at 을 자동 계산한다 */
  duration_minutes: number;
  offered_price: number;
}
