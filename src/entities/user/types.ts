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
