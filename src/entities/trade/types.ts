import type {
  Category,
  ItemCondition,
  TradeType,
} from '@/shared/config/categories';
import type { ApplicationStatus, TradeStatus } from '@/shared/config/status';
import type { UserSummary } from '@/entities/user/types';
import type { RecordedImpact } from '@/entities/impact/types';

export interface PickupZone {
  id: string;
  name: string;
}

/** 목록 아이템 (GET /api/v1/trades) */
export interface TradeListItem {
  id: string;
  trade_type: TradeType;
  title: string;
  thumbnail_url: string | null;
  category: Category;
  /** WANTED에서 희망 가격을 생략하면 BE non_null 설정으로 필드가 빠진다 */
  price?: number | null;
  available_date: string;
  pickup_zone_name: string;
  status: TradeStatus;
  author: UserSummary;
  created_at?: string;
}

/** 상세 (GET /api/v1/trades/{tradeId}) */
export interface TradeDetail {
  id: string;
  trade_type: TradeType;
  title: string;
  description: string;
  category: Category;
  condition: ItemCondition;
  price?: number | null;
  weight_kg: number;
  available_date: string;
  pickup_zone: PickupZone;
  image_urls: string[];
  status: TradeStatus;
  author: UserSummary;
  counterparty?: UserSummary;
  meeting?: TradeMeeting;
  reserved_at?: string;
  completed_at?: string;
  impact?: RecordedImpact;
  /** 내가 낸 신청의 상태. 신청한 적 없으면 null */
  my_application_status?: ApplicationStatus | null;
  /** 서버가 판단한 신청 가능 여부. 버튼 활성화는 이 값을 따른다 */
  can_apply: boolean;
  created_at: string;
}

export interface TradeApplication {
  id: string;
  applicant: UserSummary;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
}

/**
 * PATCH /api/v1/trades/{tradeId} — AVAILABLE 상태에서만 가능.
 * 보낸 필드만 바뀐다. 카테고리·상품 상태·무게·사진은 수정 대상이 아니다
 * (무게가 탄소 계산의 입력이라 등록 시점 값으로 고정한다).
 */
export interface UpdateTradeRequest {
  title?: string;
  description?: string;
  price?: number;
  available_date?: string;
  pickup_zone_id?: string;
}

export interface UpdatedTrade {
  id: string;
  title: string;
  price?: number | null;
  available_date: string;
  status: TradeStatus;
  updated_at: string;
}

/**
 * 신청 수락 시 거래 약속을 함께 확정한다.
 * BE 가 `@RequestBody` 를 필수로 받으므로 본문 없이 호출하면 400 이다.
 */
export interface AcceptApplicationRequest {
  /** ISO 8601. 서버가 @Future 로 검증하므로 과거 시각은 거절된다 */
  meeting_at: string;
  pickup_zone_id: string;
  message?: string;
}

/** BE는 취소 사유가 선택이어도 JSON 요청 본문 자체는 필수로 받는다. */
export interface TradeCancellationRequest {
  reason?: string;
}

export interface TradeMeeting {
  meeting_at: string;
  pickup_zone: PickupZone;
  message: string | null;
}

export interface TradeListFilters {
  keyword?: string;
  trade_type?: TradeType;
  category?: Category;
  status?: TradeStatus;
  available_from?: string;
  available_to?: string;
  pickup_zone_id?: string;
  page?: number;
  size?: number;
}

export interface CreateTradeRequest {
  trade_type: TradeType;
  title: string;
  description: string;
  category: Category;
  condition: ItemCondition;
  price?: number | null;
  weight_kg: number;
  available_date: string;
  pickup_zone_id: string;
  image_urls: string[];
  ai_analysis_id?: string | null;
}

/** POST /api/v1/trades 생성 직후 응답 */
export interface CreatedTrade {
  id: string;
  trade_type: TradeType;
  title: string;
  description: string;
  category: Category;
  carbon_sector: Category;
  condition: ItemCondition;
  price?: number | null;
  weight_kg: number;
  available_date: string;
  pickup_zone: PickupZone;
  status: TradeStatus;
  created_at: string;
}

/**
 * 목업 전용. BE 응답에는 `trade_id` 가 없지만(어느 게시물의 신청 목록인지는
 * 경로가 이미 알려준다), 목업 스토어는 한 배열에 전부 담아 두므로
 * 소속을 알 필드가 필요하다. 화면 코드는 이 타입을 쓰지 않는다.
 */
export type SeededTradeApplication = TradeApplication & { trade_id: string };
