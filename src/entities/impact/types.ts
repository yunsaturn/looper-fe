import type { Category } from '@/shared/config/categories';

export interface MonthlyTrendPoint {
  month: string;
  estimated_carbon_saved_kg_co2e: number;
}

/**
 * GET /api/v1/impact/me
 *
 * 표기 우선순위(기획서): ① 절약 금액 ② 줄인 폐기물 kg ③ 탄소 절감량(추정값).
 * 실측값을 위에, 추정값을 아래에 둔다.
 * `disclaimer` 는 서버가 내려주므로 프론트에서 문구를 만들지 않는다.
 */
export interface MyImpact {
  saved_amount: number;
  waste_reduced_kg: number;
  estimated_carbon_saved_kg_co2e: number;
  trade_completed_count: number;
  sharing_count: number;
  rental_completed_count: number;
  monthly_trend: MonthlyTrendPoint[];
  disclaimer: string;
}

export interface CategoryShare {
  category: Category;
  ratio: number;
}

export interface CampusRankEntry {
  campus_id: string;
  campus_name: string;
  estimated_carbon_saved_kg_co2e: number;
}

/** GET /api/v1/impact/campuses/{campusId} — 개인 실명·거래 상세는 공개하지 않는다 */
export interface CampusImpact {
  campus_id: string;
  campus_name: string;
  estimated_carbon_saved_kg_co2e: number;
  participant_count: number;
  completed_activity_count: number;
  category_shares: CategoryShare[];
  ranking: CampusRankEntry[];
  disclaimer: string;
}

export interface CarbonSectorReference {
  sector: Category;
  avoidance_factor_kg_co2e_per_kg: number;
  production_stage_ratio: number;
  sample_count: number;
}

export interface CarbonSource {
  name: string;
  published_year: number;
  product_count?: number;
  substitution_rate?: number;
}

/** GET /api/v1/carbon/references — 계산식 화면(R3 대응)의 근거 */
export interface CarbonReferences {
  formula: string;
  substitution_rate: number;
  sectors: CarbonSectorReference[];
  sources: CarbonSource[];
  reference_date: string;
  notice: string;
}
