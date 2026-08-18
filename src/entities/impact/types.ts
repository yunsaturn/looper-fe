import type { Category } from '@/shared/config/categories';

/**
 * ⚠️ BE 는 Jackson `default-property-inclusion: non_null` 이다.
 *    null 인 필드는 응답에서 **아예 빠진다**. 배열도 마찬가지이므로
 *    화면에서 `?? []` 로 받아야 렌더링 중 크래시가 나지 않는다.
 *    같은 이유로 객체 필드도 전부 optional 로 둔다.
 */

export interface MonthlyTrendPoint {
  /** 'YYYY-MM' */
  month: string;
  estimated_carbon_saved_kg_co2e: number;
}

/** 예상 절감량을 스마트폰 완전 충전 횟수로 환산한 참고 정보 */
export interface CarbonEquivalent {
  smartphone_charges: number;
  basis_kg_co2e_per_charge: number;
  source: string;
}

/**
 * 도시 묘목 1그루가 10년간 흡수하는 양으로 환산한 값.
 * 실제 식재 수가 아니라 흡수 효과의 환산이므로 화면에서 '약 N그루'로만 쓴다.
 */
export interface TreeEquivalent {
  tree_count: number;
  basis_kg_co2e_per_tree: number;
  growth_period_years: number;
  source: string;
}

/** '나의 순환숲' — 누적 탄소를 나무 그루 수와 다음 그루까지의 진행도로 */
export interface ForestProgress {
  current_trees: number;
  carbon_toward_next_tree_kg_co2e: number;
  next_tree_threshold_kg_co2e: number;
  /** 0~1 */
  progress_to_next_tree: number;
}

/** 이번 달과 지난달 비교 */
export interface MonthOverMonth {
  this_month_kg_co2e: number;
  last_month_kg_co2e: number;
  /** 0.18 = 18% 증가. 지난달이 0이면 응답에서 빠진다 */
  change_ratio?: number;
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
  tree_equivalent?: TreeEquivalent;
  forest?: ForestProgress;
  month_over_month?: MonthOverMonth;
  disclaimer: string;
}

/** 완료된 거래·대여에 스냅샷으로 남은 임팩트. 완료 전이면 응답에서 빠진다 */
export interface RecordedImpact {
  /** 계산 근거 상세 조회용 (/impact/activities/{id}) */
  activity_id: string;
  saved_amount: number;
  waste_reduced_kg: number;
  estimated_carbon_saved_kg_co2e: number;
  completed_at: string;
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

export interface CampusRankItem {
  /** 동률은 같은 순위 */
  rank: number;
  campus_id: string;
  display_name: string;
  estimated_carbon_saved_kg_co2e: number;
  /** 로그인 사용자의 소속 캠퍼스 여부 */
  mine: boolean;
}

export interface CampusRanking {
  /** 누적 절감량 상위 캠퍼스 (최대 3개) */
  top_campuses?: CampusRankItem[];
  my_campus?: CampusRankItem;
  /** 바로 위 순위까지 남은 양. 이미 1위면 응답에서 빠진다 */
  carbon_to_next_rank_kg_co2e?: number;
}

/** GET /api/v1/impact/campuses/{campusId} — 개인 실명·거래 상세는 공개하지 않는다 */
export interface CampusImpact {
  campus: CampusSummary;
  estimated_carbon_saved_kg_co2e: number;
  saved_amount: number;
  waste_reduced_kg: number;
  trade_completed_count: number;
  sharing_count: number;
  rental_completed_count: number;
  participant_count: number;
  completed_activity_count: number;
  category_breakdown?: CategoryBreakdown[];
  /** 전체 캠퍼스 중 누적 절감 순위 */
  campus_rank: number;
  ranking?: CampusRanking;
  tree_equivalent?: TreeEquivalent;
  disclaimer: string;
}

/** 기간 필터 — 없으면 전체 기간 */
export interface ImpactPeriodParams {
  /** 'YYYY-MM-DD' */
  from?: string;
  to?: string;
}

/** GET /api/v1/impact/activities/{activityId} — 한 활동의 계산 근거 스냅샷 */
export interface ImpactActivityDetail {
  activity_id: string;
  activity_type: 'TRADE' | 'RENTAL';
  weight_kg: number;
  carbon_sector: Category;
  sector_carbon_intensity: number;
  production_stage_ratio: number;
  substitution_rate: number;
  reported_substitution_rate: number;
  avoidance_factor_kg_co2e_per_kg: number;
  estimated_carbon_saved_kg_co2e: number;
  formula: string;
  reference_date: string;
  calculated_at: string;
  calculation_method: string;
  /** 현재 항상 true — 실측이 아니라 모델 기반 예상치다 */
  is_estimate: boolean;
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
