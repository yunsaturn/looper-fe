import type { Category } from '@/shared/config/categories';
import type { OfferStatus, RentalStatus } from '@/shared/config/status';
import type { UserSummary } from '@/entities/user/types';
import type { PickupZone, RecordedImpact } from '@/entities/trade/types';

/** 목록 아이템 (GET /api/v1/rentals). 기본 정렬은 start_at 오름차순 */
export interface RentalListItem {
  id: string;
  item_name: string;
  category: Category;
  start_at: string;
  due_at: string;
  pickup_zone_name: string;
  /** 가격 협의면 BE non_null 설정으로 필드가 빠진다 */
  offered_price?: number | null;
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
  offered_price?: number | null;
  status: RentalStatus;
  is_overdue: boolean;
  overdue_at: string | null;
  requester: UserSummary;
  offer_count: number;
  selected_offerer?: UserSummary & { rental_completed_count: number };
  picked_up_at?: string;
  returned_at?: string;
  completed_at?: string;
  return_message?: string;
  remaining_minutes?: number;
  impact?: RecordedImpact;
  /** 내가 낸 지원의 상태. 지원한 적 없으면 null */
  my_offer_status?: OfferStatus | null;
  /** 서버가 판단한 지원 가능 여부 */
  can_offer: boolean;
}

export interface RentalOffer {
  id: string;
  offerer: UserSummary;
  message: string | null;
  status: OfferStatus;
  created_at: string;
}

/**
 * PATCH /api/v1/rentals/{rentalId} — RECRUITING 상태에서만 가능.
 * 물품명·카테고리·픽업존·무게는 수정 대상이 아니다.
 * 시작 시각이나 사용 시간을 바꾸면 서버가 반납 예정 시각을 다시 계산한다.
 */
export interface UpdateRentalRequest {
  description?: string;
  start_at?: string;
  /** 1 ~ 10080 (7일) */
  duration_minutes?: number;
  offered_price?: number;
}

export interface UpdatedRental {
  id: string;
  start_at: string;
  duration_minutes: number;
  /** 서버가 start_at + duration_minutes 로 다시 계산해 내려준다 */
  due_at: string;
  offered_price?: number | null;
  status: RentalStatus;
  updated_at: string;
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
  offered_price?: number | null;
  /** 탄소 절감량 계산 입력. BE가 양수 값을 필수로 검증한다 */
  weight_kg: number;
}

/** POST /api/v1/rentals 생성 직후 응답 */
export interface CreatedRental {
  id: string;
  item_name: string;
  category: Category;
  description: string;
  pickup_zone: PickupZone;
  start_at: string;
  duration_minutes: number;
  due_at: string;
  offered_price?: number | null;
  status: RentalStatus;
  created_at: string;
}

/** BE는 사유가 선택이어도 JSON 요청 본문 자체는 필수로 받는다. */
export interface RentalCancellationRequest {
  reason?: string;
}

/** 반납 메시지가 선택이어도 JSON 요청 본문 자체는 필수다. */
export interface RentalReturnRequest {
  message?: string;
}

/** 목업 전용. BE 응답에는 `rental_id` 가 없다. (사유는 SeededTradeApplication 참고) */
export type SeededRentalOffer = RentalOffer & { rental_id: string };
