/**
 * ─────────────────────────────────────────────────────────────
 *  거래·대여 상태 단일 출처 (Single Source of Truth)
 * ─────────────────────────────────────────────────────────────
 *  기획서 R5 대응: "상태를 서버 단일 출처로 관리한다 /
 *  프론트는 서버 응답 상태를 그대로 렌더링한다"
 *
 *  프론트에서 상태를 임의로 계산하거나 낙관적으로 바꾸지 않는다.
 *  이 파일은 서버가 내려준 상태 코드를 화면 표현(라벨·색상)으로
 *  옮기는 매핑과, 어떤 액션 버튼을 보여줄지 판단하기 위한
 *  전이 규칙만 담는다.
 *
 *  ⚠️ 상태 문자열은 BE Enum 값과 반드시 일치해야 한다.
 *     현재 값은 기획서 기준 잠정값이며, BE API 명세(Swagger)가
 *     도착하면 이 파일의 코드값만 맞추면 된다.
 *     화면 코드는 항상 이 파일의 상수를 import 해서 쓰고,
 *     문자열 리터럴을 직접 쓰지 않는다.
 * ─────────────────────────────────────────────────────────────
 */

/** 뱃지 색상 계열. index.css 의 --color-tone-* 와 1:1 대응 */
export type StatusTone =
  | 'neutral'
  | 'info'
  | 'brand'
  | 'warning'
  | 'danger'
  | 'done';

export interface StatusMeta {
  /** 뱃지에 노출되는 한글 라벨 */
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

/* ─────────────────────────── 거래 ─────────────────────────── */

/**
 * 거래 흐름 (기획서 4-1)
 *   거래 가능 → 거래 신청 → 작성자가 신청자 1명 수락 → 예약 중
 *   → 지정 날짜에 픽업존에서 전달 → 양측 확인으로 거래 완료
 *
 * 규칙
 *   - 동일 게시물에 활성 신청은 1건만 허용 (서버가 강제)
 *   - 예약 취소 시 AVAILABLE 로 복귀
 *   - COMPLETED 는 MVP 에서 되돌릴 수 없음
 */
export const TRADE_STATUS = {
  /** 거래 가능 — 신청을 받을 수 있는 상태 */
  AVAILABLE: 'AVAILABLE',
  /** 신청 대기 — 신청이 들어왔고 작성자의 수락을 기다리는 상태 */
  APPLIED: 'APPLIED',
  /** 예약 중 — 신청자 1명이 수락되어 지정 날짜를 기다리는 상태 */
  RESERVED: 'RESERVED',
  /** 거래 완료 — 양측 확인 완료. 되돌릴 수 없음 */
  COMPLETED: 'COMPLETED',
  /** 거래 취소 — 게시물 자체가 내려간 상태 */
  CANCELED: 'CANCELED',
} as const;

export type TradeStatus = (typeof TRADE_STATUS)[keyof typeof TRADE_STATUS];

export const TRADE_STATUS_META: Record<TradeStatus, StatusMeta> = {
  AVAILABLE: {
    label: '거래 가능',
    tone: 'brand',
    description: '지금 거래를 신청할 수 있어요.',
  },
  APPLIED: {
    label: '신청 대기',
    tone: 'info',
    description: '신청이 접수되어 작성자의 수락을 기다리고 있어요.',
  },
  RESERVED: {
    label: '예약 중',
    tone: 'warning',
    description: '거래가 확정되었어요. 약속한 날짜에 픽업존에서 만나세요.',
  },
  COMPLETED: {
    label: '거래 완료',
    tone: 'done',
    description: '거래가 완료되었어요. 완료된 거래는 되돌릴 수 없어요.',
  },
  CANCELED: {
    label: '거래 취소',
    tone: 'neutral',
    description: '취소된 거래예요.',
  },
};

/** 거래 상태 전이 규칙. 여기에 없는 전이는 UI 에서 액션을 노출하지 않는다. */
export const TRADE_TRANSITIONS: Record<TradeStatus, readonly TradeStatus[]> = {
  AVAILABLE: ['APPLIED', 'CANCELED'],
  APPLIED: ['RESERVED', 'AVAILABLE'], // 수락 / 신청 철회·거절
  RESERVED: ['COMPLETED', 'AVAILABLE'], // 완료 / 예약 취소 시 다시 거래 가능
  COMPLETED: [], // 되돌릴 수 없음 (기획서 명시)
  CANCELED: [],
};

/* ─────────────────────────── 대여 ─────────────────────────── */

/**
 * 대여 흐름 (기획서 4-2) — 방향이 뒤집힌 구조
 *   필요한 사람이 요청을 올리고, 보유자가 '빌려줄게요'로 지원한다.
 *
 *   지원자 모집 중 → 빌려줄게요 지원 → 요청자가 지원자 선택
 *   → 대여 확정 → 물품 수령(대여 중) → 반납 → 지원자 확인 → 반납 완료
 *
 * 규칙
 *   - 반납 예정 시간을 넘기면 OVERDUE 로 표시되고 신뢰도에 반영
 *   - 물품 수령(IN_USE) 전까지는 요청자·지원자 모두 취소 가능
 */
export const RENTAL_STATUS = {
  /** 지원자 모집 중 — 아직 지원자가 선택되지 않은 상태 */
  OPEN: 'OPEN',
  /** 대여 확정 — 지원자가 선택되어 수령을 기다리는 상태 */
  MATCHED: 'MATCHED',
  /** 대여 중 — 물품을 수령해 사용 중인 상태 */
  IN_USE: 'IN_USE',
  /** 반납 대기 — 요청자가 '반납했어요'를 눌러 지원자 확인을 기다리는 상태 */
  RETURN_PENDING: 'RETURN_PENDING',
  /** 반납 지연 — 반납 예정 시간을 초과한 상태 */
  OVERDUE: 'OVERDUE',
  /** 반납 완료 — 양측 확인 완료 */
  RETURNED: 'RETURNED',
  /** 대여 취소 — 수령 전 취소 */
  CANCELED: 'CANCELED',
} as const;

export type RentalStatus = (typeof RENTAL_STATUS)[keyof typeof RENTAL_STATUS];

export const RENTAL_STATUS_META: Record<RentalStatus, StatusMeta> = {
  OPEN: {
    label: '지원자 모집 중',
    tone: 'brand',
    description: '빌려줄 수 있는 학생을 찾고 있어요.',
  },
  MATCHED: {
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
  OVERDUE: {
    label: '반납 지연',
    tone: 'danger',
    description: '반납 예정 시간이 지났어요. 지연은 신뢰도에 반영돼요.',
  },
  RETURNED: {
    label: '반납 완료',
    tone: 'done',
    description: '반납이 완료되었어요.',
  },
  CANCELED: {
    label: '대여 취소',
    tone: 'neutral',
    description: '취소된 대여예요.',
  },
};

/** 대여 상태 전이 규칙 */
export const RENTAL_TRANSITIONS: Record<RentalStatus, readonly RentalStatus[]> =
  {
    OPEN: ['MATCHED', 'CANCELED'],
    MATCHED: ['IN_USE', 'CANCELED'], // 수령 전까지 양측 취소 가능
    IN_USE: ['RETURN_PENDING', 'OVERDUE'],
    RETURN_PENDING: ['RETURNED', 'OVERDUE'],
    OVERDUE: ['RETURN_PENDING', 'RETURNED'], // 지연 상태에서도 반납은 가능
    RETURNED: [],
    CANCELED: [],
  };

/* ───────────────────────── 헬퍼 ───────────────────────── */

export function canTransitionTrade(from: TradeStatus, to: TradeStatus): boolean {
  return TRADE_TRANSITIONS[from].includes(to);
}

export function canTransitionRental(
  from: RentalStatus,
  to: RentalStatus,
): boolean {
  return RENTAL_TRANSITIONS[from].includes(to);
}

/**
 * 예약 중이면서 거래 날짜가 아직 오지 않은 건은 '미래 날짜 예약 중'으로
 * 구분해 보여준다. 기획서의 미래 시점 예약 거래를 화면에서 드러내기 위한
 * 표시 전용 구분이며, 서버 상태는 그대로 RESERVED 다.
 */
export function resolveTradeStatusLabel(
  status: TradeStatus,
  tradeDate?: string | null,
  now: Date = new Date(),
): string {
  if (status !== TRADE_STATUS.RESERVED || !tradeDate) {
    return TRADE_STATUS_META[status].label;
  }

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  return new Date(tradeDate).getTime() > today
    ? '미래 날짜 예약 중'
    : TRADE_STATUS_META[status].label;
}

/**
 * 시연 검증용 — 기획서가 요구한 9개 상태.
 * 시드 데이터가 이 9개를 모두 포함하는지 확인하는 데 사용한다.
 * (R2 대응: "첫 화면부터 채워진 상태로 보이게 한다")
 */
export const DEMO_REQUIRED_STATUSES = [
  '거래 가능',
  '신청 대기',
  '미래 날짜 예약 중',
  '거래 완료',
  '지원자 모집 중',
  '대여 확정',
  '대여 중',
  '반납 지연',
  '반납 완료',
] as const;
