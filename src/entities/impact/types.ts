import type { Category } from '@/shared/config/categories';

/**
 * ⚠️ BE 는 Jackson `default-property-inclusion: non_null` 이다.
 *    null 인 필드는 응답에서 **아예 빠진다**. 배열도 마찬가지이므로
 *    화면에서 `?? []` 로 받아야 렌더링 중 크래시가 나지 않는다.
 */

/** 예상 절감량을 스마트폰 완전 충전 횟수로 환산한 참고 정보 */
export interface CarbonEquivalent {
  smartphone_charges: number;
  basis_kg_co2e_per_charge: number;
  source: string;
}

export interface MonthlyTrendPoint {
  /** 'YYYY-MM' */
  month: string;
  estimated_carbon_saved_kg_co2e: number;
}

/**
 * GET /api/v1/impact/me
 *
 * 표기 우선순위(기획서): ① 절약 금액 ② 줄인 폐기물 kg ③ 탄소 절감량(추정값).
 * `disclaimer` 는 서버가 내려주므로 프론트에서 문구를 만들지 않는다.
 */
export interface MyImpact {
  saved_amount: number;
  waste_reduced_kg: number;
  estimated_carbon_saved_kg_co2e: number;
  trade_completed_count: number;
  sharing_count: number;
  rental_completed_count: number;
  monthly_trend?: MonthlyTrendPoint[];
  equivalent?: CarbonEquivalent;
  disclaimer: string;
}

export interface CampusSummary {
  id: string;
  /** 학교명 + 캠퍼스명을 합친 표시명 */
  name: string;
}

export interface CategoryBreakdown {
  category: Category;
  /** 0~1 */
  ratio: number;
}

/** GET /api/v1/impact/campuses/{campusId} — 개인 실명·거래 상세는 공개하지 않는다 */
export interface CampusImpact {
  campus: CampusSummary;
  estimated_carbon_saved_kg_co2e: number;
  participant_count: number;
  completed_activity_count: number;
  category_breakdown?: CategoryBreakdown[];
  /** 전체 캠퍼스 중 누적 절감 순위 */
  campus_rank: number;
  disclaimer: string;
}

export interface CarbonSectorReference {
  sector: Category;
  carbon_intensity_kg_co2e_per_kg: number;
  avoidance_factor_kg_co2e_per_kg: number;
  production_stage_ratio: number;
  applied_substitution_rate: number;
  sample_count: number;
  calculation_method: string;
}

export interface CarbonSource {
  name: string;
  published_year: number;
  /** 분석 제품 수. 해당 없으면 응답에서 빠진다 */
  product_count?: number;
  /** 출처가 보고한 원 대체율. 해당 없으면 응답에서 빠진다 */
  reported_substitution_rate?: number;
}

/** GET /api/v1/carbon/references — 계산식 화면(R3 대응)의 근거 */
export interface CarbonReferences {
  formula: string;
  substitution_rate: number;
  sectors?: CarbonSectorReference[];
  sources?: CarbonSource[];
  /** 'YYYY-MM-DD' */
  reference_date: string;
  notice: string;
}
