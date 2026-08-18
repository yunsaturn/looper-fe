/** 게시물·신청자 목록 등에 붙는 공개 사용자 요약 */
export interface UserSummary {
  id: string;
  nickname: string;
  trust_score: number;
}

/** BE 는 학교·캠퍼스를 **중첩 객체**로 내려준다. 평평한 필드가 아니다. */
export interface SchoolSummary {
  id: string;
  name: string;
}

export interface CampusSummary {
  id: string;
  name: string;
}

export interface MyProfile {
  id: string;
  email: string;
  nickname: string;
  school: SchoolSummary;
  campus: CampusSummary;
  department: string | null;
  main_building: string | null;
  trust_score: number;
  trade_completed_count: number;
  rental_completed_count: number;
}

/** 공개 프로필 — 이메일 등 계정 정보는 내려오지 않는다 (기획서 R6) */
export interface PublicProfile {
  id: string;
  nickname: string;
  school_name: string;
  campus_name: string;
  trust_score: number;
  trade_completed_count: number;
  rental_completed_count: number;
}

/** PATCH /api/v1/users/me — 보낸 필드만 바뀐다. 빼면 기존 값 유지 */
export interface UpdateProfileRequest {
  nickname?: string;
  department?: string;
  main_building?: string;
}

/** 수정 응답은 바뀐 필드만 돌려준다. 전체 프로필은 다시 조회해야 한다 */
export interface UpdatedProfile {
  id: string;
  nickname: string;
  department: string | null;
  main_building: string | null;
  updated_at: string;
}

/**
 * DELETE /api/v1/users/me — 계정 비활성화 + 개인정보 익명화.
 * 완료 이력과 캠퍼스 임팩트는 익명 상태로 보존된다.
 *
 * `confirmation` 은 반드시 'DELETE' 여야 한다(서버가 정규식으로 강제).
 */
export interface WithdrawalRequest {
  password: string;
  confirmation: 'DELETE';
}

export interface WithdrawalResult {
  user_id: string;
  withdrawn: boolean;
  withdrawn_at: string;
}

/** 서버가 확인 문구로 요구하는 값 */
export const WITHDRAWAL_CONFIRMATION = 'DELETE' as const;

/* ─────────────────── 내 활동 통합 조회 ─────────────────── */

export const ACTIVITY_RESOURCE_TYPE = {
  ALL: 'ALL',
  TRADE: 'TRADE',
  RENTAL: 'RENTAL',
} as const;

export type ActivityResourceType =
  (typeof ACTIVITY_RESOURCE_TYPE)[keyof typeof ACTIVITY_RESOURCE_TYPE];

/**
 * 내가 그 활동에서 맡은 역할.
 *   거래  OWNER(작성자) · APPLICANT(신청자)
 *   대여  REQUESTER(요청자) · OFFERER(빌려주는 사람)
 */
export const ACTIVITY_ROLE = {
  ALL: 'ALL',
  OWNER: 'OWNER',
  APPLICANT: 'APPLICANT',
  REQUESTER: 'REQUESTER',
  OFFERER: 'OFFERER',
} as const;

export type ActivityRole = (typeof ACTIVITY_ROLE)[keyof typeof ACTIVITY_ROLE];

export interface ActivityCounterparty {
  id: string;
  nickname: string;
  trust_score: number;
}

/**
 * 거래와 대여를 한 목록에 합쳐 놓은 항목.
 * `status` 는 거래 상태(TradeStatus)일 수도 대여 상태(RentalStatus)일 수도
 * 있으므로 문자열로 받고, 화면에서 resource_type 을 보고 해석한다.
 */
export interface ActivityItem {
  id: string;
  resource_type: Exclude<ActivityResourceType, 'ALL'>;
  /** 거래는 TradeType(SALE/SHARE/WANTED), 대여는 'RENTAL' */
  activity_type: string;
  title: string;
  thumbnail_url?: string;
  role: Exclude<ActivityRole, 'ALL'>;
  status: string;
  /** 신청·지원이 확정된 경우에만 온다 */
  counterparty?: ActivityCounterparty;
  meeting_at?: string;
  due_at?: string;
  overdue: boolean;
  created_at: string;
  completed_at?: string;
}

export interface ActivityFilters {
  resource_type?: ActivityResourceType;
  role?: ActivityRole;
  /** 거래 또는 대여 상태명 */
  status?: string;
  is_overdue?: boolean;
  sort?: 'LATEST' | 'OLDEST';
  page?: number;
  size?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  access_token_expires_in: number;
}

export interface LoginResponse extends AuthTokens {
  user: UserSummary & { campus_id: string };
}

export interface LoginRequest {
  email: string;
  password: string;
}
