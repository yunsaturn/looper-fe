/**
 * 알림.
 *
 * 서버가 거래 신청·수락·예약 취소·완료, 대여 지원·선택·수령·반납·지연에
 * 알림을 만든다. 폴링은 하지 않고 목록·미읽음 수를 조회하는 방식이다.
 */

/** notification/domain/NotificationType.java 와 1:1 */
export const NOTIFICATION_TYPE = {
  TRADE_APPLICATION_RECEIVED: 'TRADE_APPLICATION_RECEIVED',
  TRADE_APPLICATION_ACCEPTED: 'TRADE_APPLICATION_ACCEPTED',
  TRADE_RESERVATION_CANCELLED: 'TRADE_RESERVATION_CANCELLED',
  TRADE_COMPLETION_REQUESTED: 'TRADE_COMPLETION_REQUESTED',
  TRADE_COMPLETED: 'TRADE_COMPLETED',
  RENTAL_OFFER_RECEIVED: 'RENTAL_OFFER_RECEIVED',
  RENTAL_OFFER_SELECTED: 'RENTAL_OFFER_SELECTED',
  RENTAL_PICKUP_CONFIRMED: 'RENTAL_PICKUP_CONFIRMED',
  RENTAL_RETURN_REQUESTED: 'RENTAL_RETURN_REQUESTED',
  RENTAL_RETURN_CONFIRMED: 'RENTAL_RETURN_CONFIRMED',
  RENTAL_CANCELLED: 'RENTAL_CANCELLED',
  RENTAL_OVERDUE: 'RENTAL_OVERDUE',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_RESOURCE_TYPE = {
  TRADE: 'TRADE',
  RENTAL: 'RENTAL',
} as const;

export type NotificationResourceType =
  (typeof NOTIFICATION_RESOURCE_TYPE)[keyof typeof NOTIFICATION_RESOURCE_TYPE];

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  resource_type: NotificationResourceType;
  resource_id: string;
  read: boolean;
  /** 읽지 않았으면 응답에서 빠진다 */
  read_at?: string;
  created_at: string;
}

export interface NotificationFilters {
  unread_only?: boolean;
  page?: number;
  size?: number;
}

export interface UnreadCount {
  count: number;
}

export interface ReadResult {
  notification_id: string;
  read_at: string;
}

export interface ReadAllResult {
  updated_count: number;
  read_at: string;
}
