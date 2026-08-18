import type {
  Category,
  ItemCondition,
  TradeType,
} from '@/shared/config/categories';
import type { ApplicationStatus, TradeStatus } from '@/shared/config/status';
import type { UserSummary } from '@/entities/user/types';

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
  price: number;
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
  price: number;
  weight_kg: number | null;
  available_date: string;
  pickup_zone: PickupZone;
  image_urls: string[];
  status: TradeStatus;
  author: UserSummary;
  /** 내가 낸 신청의 상태. 신청한 적 없으면 null */
  my_application_status: ApplicationStatus | null;
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
  price: number;
  weight_kg: number | null;
  available_date: string;
  pickup_zone_id: string;
  image_urls: string[];
  ai_analysis_id?: string | null;
}

/**
 * 목업 전용. BE 응답에는 `trade_id` 가 없지만(어느 게시물의 신청 목록인지는
 * 경로가 이미 알려준다), 목업 스토어는 한 배열에 전부 담아 두므로
 * 소속을 알 필드가 필요하다. 화면 코드는 이 타입을 쓰지 않는다.
 */
export type SeededTradeApplication = TradeApplication & { trade_id: string };
