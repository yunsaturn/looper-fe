/** AI 상태 비교 결과 — "손상 확정" 표현은 UI 에서 사용하지 않는다 */
export const AI_CONDITION_STATUS = {
  NORMAL: 'NORMAL',
  CHECK: 'CHECK',
  DAMAGE_SUSPECTED: 'DAMAGE_SUSPECTED',
} as const;

export type AiConditionStatus =
  (typeof AI_CONDITION_STATUS)[keyof typeof AI_CONDITION_STATUS];

export const REPORT_TYPE = {
  APPEARANCE_DAMAGE: 'APPEARANCE_DAMAGE',
  FUNCTIONAL_DEFECT: 'FUNCTIONAL_DEFECT',
  MISSING_COMPONENT: 'MISSING_COMPONENT',
  UNRETURNED: 'UNRETURNED',
  OTHER: 'OTHER',
} as const;

export type ReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];

export interface ConditionPhotos {
  image_urls: string[];
  description?: string | null;
  components?: string[] | null;
  registered_at?: string;
}

export interface AiCompareResult {
  status: AiConditionStatus;
  damage_suspicion_score: number;
  needs_retake: boolean;
  message?: string | null;
}

export interface RentalReport {
  id: string;
  report_type: ReportType;
  description: string;
  evidence_urls?: string[];
  created_at: string;
}

/** GET /api/v1/rentals/{id}/safety */
export interface SafetyInfo {
  before: ConditionPhotos | null;
  after: ConditionPhotos | null;
  ai_result: AiCompareResult | null;
  reports: RentalReport[];
  /** 빌린 사람이 상태 일치를 확인했는지 */
  condition_accepted: boolean;
  /** 제공자가 정상 반납을 승인했는지 */
  return_approved: boolean;
}

export interface ConditionBeforeRequest {
  image_urls: string[];
  description?: string;
  components?: string[];
}

export interface ConditionAfterRequest {
  image_urls: string[];
  description?: string;
}

/** POST condition/after 응답 — AI 비교 결과를 즉시 반환한다 */
export type ConditionAfterResponse = AiCompareResult;

export interface CreateReportRequest {
  report_type: ReportType;
  description: string;
  evidence_urls?: string[];
}
