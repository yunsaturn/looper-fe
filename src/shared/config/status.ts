/**
 * ─────────────────────────────────────────────────────────────
 *  거래·대여 상태 단일 출처 (Single Source of Truth)
 * ─────────────────────────────────────────────────────────────
 * 값은 BE 소스의 Java enum 과 1:1로 대조해 맞췄다.
 *  (trade/domain/TradeStatus, TradeApplicationStatus,
 *   rental/domain/RentalStatus, RentalOfferStatus)
 *
 *  기획서 R5 대응: "상태를 서버 단일 출처로 관리한다 /
 *  프론트는 서버 응답 상태를 그대로 렌더링한다"
 *
 *  상태는 네 갈래로 나뉜다.
 *    1. 거래 게시물   TradeStatus
 *    2. 거래 신청     ApplicationStatus   (신청자 관점)
 *    3. 대여 요청     RentalStatus
 *    4. 대여 지원     OfferStatus         (지원자 관점)
 *
 *  반납 지연은 상태가 아니라 `is_overdue` 불리언 플래그다.
 *  RentalStatus 와 독립적으로 겹쳐 표시해야 한다.
 * ─────────────────────────────────────────────────────────────
 */

/** 뱃지 색상 계열. index.css 의 --color-tone-* 와 1:1 대응 */
export type StatusTone =
  'neutral' | 'info' | 'brand' | 'warning' | 'danger' | 'done';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  /** 상세 화면 안내 문구 */
  description: string;
}

/** 톤 → Tailwind 클래스. StatusBadge 가 이 맵만 참조한다. */
export const TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'bg-tone-neutral-bg text-tone-neutral-fg',
  info: 'bg-tone-info-bg text-tone-info-fg',
  brand: 'bg-tone-brand-bg text-tone-brand-fg',
  warning: 'bg-tone-warning-bg text-tone-warning-fg',
  danger: 'bg-tone-danger-bg text-tone-danger-fg',
  done: 'bg-tone-done-bg text-tone-done-fg',
};

/* ─────────────────── 1. 거래 게시물 ─────────────────── */

/**
 * 흐름: 거래 가능 → (신청 접수) → 작성자가 1명 수락 → 예약 중
 *       → 완료 요청 → 상대방 확인 → 거래 완료
 *
 * 신청이 들어와도 게시물 자체는 AVAILABLE 을 유지한다.
 * '신청 대기'는 게시물이 아니라 신청 건의 상태(ApplicationStatus.PENDING)다.
 */
export const TRADE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  /** 한쪽이 완료를 요청하고 상대방 확인을 기다리는 상태 */
  COMPLETION_PENDING: 'COMPLETION_PENDING',
  COMPLETED: 'COMPLETED',
} as const;

export type TradeStatus = (typeof TRADE_STATUS)[keyof typeof TRADE_STATUS];

export const TRADE_STATUS_META: Record<TradeStatus, StatusMeta> = {
  AVAILABLE: {
    label: '거래 가능',
    tone: 'brand',
    description: '지금 거래를 신청할 수 있어요.',
  },
  RESERVED: {
    label: '예약 중',
    tone: 'warning',
    description: '거래가 확정되었어요. 약속한 날짜에 픽업존에서 만나세요.',
  },
  COMPLETION_PENDING: {
    label: '완료 확인 대기',
    tone: 'info',
    description: '상대방의 완료 확인을 기다리고 있어요.',
  },
  COMPLETED: {
    label: '거래 완료',
    tone: 'done',
    description: '거래가 완료되었어요. 완료된 거래는 되돌릴 수 없어요.',
  },
};

export const TRADE_TRANSITIONS: Record<TradeStatus, readonly TradeStatus[]> = {
  AVAILABLE: ['RESERVED'],
  RESERVED: ['COMPLETION_PENDING', 'AVAILABLE'], // 예약 취소 시 다시 거래 가능
  COMPLETION_PENDING: ['COMPLETED'],
  COMPLETED: [], // 되돌릴 수 없음 (기획서 명시)
};

/* ─────────────────── 2. 거래 신청 ─────────────────── */

/** 한 사용자는 동일 게시물에 활성 신청을 1건만 가질 수 있다 (서버가 강제) */
export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  /** 다른 신청자가 수락되어 자동 마감된 상태 */
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export const APPLICATION_STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  PENDING: {
    label: '신청 대기',
    tone: 'info',
    description: '작성자의 수락을 기다리고 있어요.',
  },
  ACCEPTED: {
    label: '신청 수락됨',
    tone: 'brand',
    description: '신청이 수락되었어요. 약속한 날짜에 만나세요.',
  },
  CLOSED: {
    label: '마감됨',
    tone: 'neutral',
    description: '다른 신청자가 수락되어 마감되었어요.',
  },
  CANCELLED: {
    label: '신청 취소',
    tone: 'neutral',
    description: '취소된 신청이에요.',
  },
};

/* ─────────────────── 3. 대여 요청 ─────────────────── */

/**
 * 흐름: 지원자 모집 중 → 요청자가 지원자 1명 선택 → 대여 확정
 *       → 물품 수령(대여 중) → 반납 요청 → 지원자 확인 → 반납 완료
 */
export const RENTAL_STATUS = {
  RECRUITING: 'RECRUITING',
  CONFIRMED: 'CONFIRMED',
  IN_USE: 'IN_USE',
  /** 요청자가 '반납했어요'를 눌러 지원자 확인을 기다리는 상태 */
  RETURN_PENDING: 'RETURN_PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type RentalStatus = (typeof RENTAL_STATUS)[keyof typeof RENTAL_STATUS];

export const RENTAL_STATUS_META: Record<RentalStatus, StatusMeta> = {
  RECRUITING: {
    label: '모집 중',
    tone: 'brand',
    description: '빌려줄 수 있는 학생을 찾고 있어요.',
  },
  CONFIRMED: {
    label: '대여 확정',
    tone: 'info',
    description: '대여가 확정되었어요. 약속한 장소에서 물품을 받으세요.',
  },
  IN_USE: {
    label: '대여 중',
    tone: 'warning',
    description: '사용 중이에요. 반납 예정 시간을 지켜주세요.',
  },
  RETURN_PENDING: {
    label: '반납 확인 대기',
    tone: 'info',
    description: '반납이 접수되어 빌려준 학생의 확인을 기다리고 있어요.',
  },
  COMPLETED: {
    label: '반납 완료',
    tone: 'done',
    description: '반납이 완료되었어요.',
  },
  CANCELLED: {
    label: '대여 취소',
    tone: 'neutral',
    description: '취소된 대여예요.',
  },
};

export const RENTAL_TRANSITIONS: Record<RentalStatus, readonly RentalStatus[]> =
  {
    RECRUITING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['IN_USE', 'CANCELLED'], // 수령 전까지 양측 취소 가능
    IN_USE: ['RETURN_PENDING'],
    RETURN_PENDING: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };

/* ─────────────────── 4. 대여 지원 ─────────────────── */

export const OFFER_STATUS = {
  PENDING: 'PENDING',
  SELECTED: 'SELECTED',
  /** 다른 지원자가 선택되어 자동 마감된 상태 */
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type OfferStatus = (typeof OFFER_STATUS)[keyof typeof OFFER_STATUS];

export const OFFER_STATUS_META: Record<OfferStatus, StatusMeta> = {
  PENDING: {
    label: '지원 대기',
    tone: 'info',
    description: '요청자의 선택을 기다리고 있어요.',
  },
  SELECTED: {
    label: '지원 선택됨',
    tone: 'brand',
    description: '요청자가 회원님을 선택했어요.',
  },
  CLOSED: {
    label: '마감됨',
    tone: 'neutral',
    description: '다른 지원자가 선택되어 마감되었어요.',
  },
  CANCELLED: {
    label: '지원 취소',
    tone: 'neutral',
    description: '취소된 지원이에요.',
  },
};

/* ─────────────────── 반납 지연 ─────────────────── */

/**
 * 반납 지연은 상태가 아니라 별도 불리언 플래그(`is_overdue`)다.
 * 예를 들어 status=IN_USE 이면서 is_overdue=true 인 조합이 존재한다.
 * 따라서 상태 뱃지 옆에 겹쳐서 표시한다.
 */
export const OVERDUE_META: StatusMeta = {
  label: '반납 지연',
  tone: 'danger',
  description: '반납 예정 시간이 지났어요. 지연은 신뢰도에 반영돼요.',
};

/* ─────────────────── 헬퍼 ─────────────────── */

export function canTransitionTrade(
  from: TradeStatus,
  to: TradeStatus,
): boolean {
  return TRADE_TRANSITIONS[from].includes(to);
}

export function canTransitionRental(
  from: RentalStatus,
  to: RentalStatus,
): boolean {
  return RENTAL_TRANSITIONS[from].includes(to);
}

/**
 * 예약 중이면서 거래 예정일이 아직 오지 않은 건은 '미래 날짜 예약 중'으로
 * 구분해 보여준다. 기획서의 미래 시점 예약 거래를 화면에서 드러내기 위한
 * 표시 전용 구분이며, 서버 상태는 그대로 RESERVED 다.
 */
export function resolveTradeStatusLabel(
  status: TradeStatus,
  availableDate?: string | null,
  now: Date = new Date(),
): string {
  if (status !== TRADE_STATUS.RESERVED || !availableDate) {
    return TRADE_STATUS_META[status].label;
  }

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  return new Date(availableDate).getTime() > today
    ? '미래 날짜 예약 중'
    : TRADE_STATUS_META[status].label;
}

/**
 * 시연 검증용 — 기획서가 요구한 9개 상태.
 * 서버 모델에서는 이 9개가 네 갈래 상태와 is_overdue 플래그에 걸쳐 있다.
 * 시드 데이터가 이 9개를 모두 만들어내는지 확인하는 데 사용한다.
 * (R2 대응: "첫 화면부터 채워진 상태로 보이게 한다")
 */
export const DEMO_REQUIRED_STATUSES = [
  { label: '거래 가능', source: 'TradeStatus.AVAILABLE' },
  { label: '신청 대기', source: 'ApplicationStatus.PENDING' },
  { label: '미래 날짜 예약 중', source: 'TradeStatus.RESERVED + 미래 날짜' },
  { label: '거래 완료', source: 'TradeStatus.COMPLETED' },
  { label: '모집 중', source: 'RentalStatus.RECRUITING' },
  { label: '대여 확정', source: 'RentalStatus.CONFIRMED' },
  { label: '대여 중', source: 'RentalStatus.IN_USE' },
  { label: '반납 지연', source: 'is_overdue = true' },
  { label: '반납 완료', source: 'RentalStatus.COMPLETED' },
] as const;
