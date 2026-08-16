/**
 * ─────────────────────────────────────────────────────────────
 *  탄소 절감량 계수 · 계산 · 표기 규칙
 * ─────────────────────────────────────────────────────────────
 *  기획서 R3 대응(그린워싱 지적 위험)의 핵심 파일이다.
 *
 *  원칙
 *   1. 모든 수치는 "예상 절감량"이며 실측값이 아니다.
 *   2. 계산식과 계수 출처·기준일을 화면에서 확인할 수 있어야 한다.
 *   3. 실측값(절약 금액·줄인 폐기물 kg)을 위에, 추정값(kgCO₂e)을
 *      아래에 배치한다.
 *   4. 계수는 팀이 임의로 만들지 않고 외부 공개 자료를 정제해 쓴다.
 *
 *  ⚠️ 실제 절감량 계산과 누적은 서버가 수행한다.
 *     (거래 완료·반납 완료 시점에 1회만 반영 — 서버가 강제)
 *     이 파일의 계산 함수는 등록 화면의 미리보기와 계산식 설명
 *     화면에서만 쓰고, 대시보드 수치는 서버 응답을 그대로 쓴다.
 *
 *  ⚠️ 계수·출처·기준일은 `GET /api/v1/carbon/references` 로도 내려온다.
 *     계산식 화면(/impact/method)은 그 응답을 우선 사용하고,
 *     아래 상수는 응답 실패 시 폴백으로만 쓴다.
 *     임팩트 대시보드 응답에는 `disclaimer` 문자열이 포함되므로,
 *     서버가 준 문구가 있으면 CARBON_DISCLAIMER 대신 그것을 노출한다.
 * ─────────────────────────────────────────────────────────────
 */

import type { CarbonSector } from '@/shared/config/categories';

/** 중고 구매가 신제품 구매를 대체하는 비율. WRAP 2025 (설문 7,061건, 64.6%) */
export const SUBSTITUTION_RATE = 0.65;

export interface SectorFactor {
  /** 섹터 대표 탄소집약도 (kgCO₂e/kg). Carbon Catalogue 866개 제품 중앙값 */
  intensity: number;
  /**
   * 재사용으로 실제 회피되는 구간(원료~제조)의 비율.
   * 사용·폐기 단계는 다음 사용자가 그대로 발생시키므로 제외한다.
   */
  productionShare: number;
  /** 최종 회피계수 (kgCO₂e/kg) = intensity × productionShare × 대체율 */
  avoidanceFactor: number;
}

/**
 * 섹터별 계수. avoidanceFactor 는 기획서에 확정 값으로 명시된 수치이고,
 * intensity 는 거기서 역산한 값이다(계산식 설명 화면 표기용).
 *
 * 출처: Meinrenken et al., "The Carbon Catalogue, carbon footprints of
 *       866 commercial products", Nature Scientific Data (2022)
 */
export const SECTOR_FACTORS: Record<CarbonSector, SectorFactor> = {
  HOME_LIVING: {
    intensity: 4.32,
    productionShare: 0.687,
    avoidanceFactor: 1.93,
  },
  ELECTRONICS: {
    intensity: 45.47,
    productionShare: 0.607,
    avoidanceFactor: 17.94,
  },
  BOOKS_PAPER: {
    intensity: 0.81,
    productionShare: 0.946,
    avoidanceFactor: 0.5,
  },
};

/** 계수 출처 메타. 계산식 설명 화면(/impact/method)에서 그대로 노출한다. */
export const CARBON_SOURCE = {
  dataset: 'The Carbon Catalogue (866 commercial products)',
  citation:
    'Meinrenken et al., Nature Scientific Data (2022), Springer Nature figshare',
  substitutionSource: 'WRAP 2025 보고서 (설문 7,061건, 64.6%)',
  /** 원본 데이터의 한계 — 발표에서 선제적으로 공개한다 */
  limitations: [
    '원본 데이터 수집 기간은 2013~2017년입니다.',
    'LCA 프로토콜이 혼재합니다 (ISO 353건 / GHGP 183건 / 미보고 179건 / PAS2050 73건).',
    '국내 제품은 22건으로, 국내 환경성적표지(EPD)와 교차검증이 필요합니다.',
    '같은 품목도 기능 단위·시스템 경계 차이로 최대 478배까지 벌어져, 개별값 대신 섹터 중앙값을 사용했습니다.',
  ],
} as const;

/**
 * 탄소 수치 옆에 반드시 따라붙어야 하는 각주.
 * CarbonHeroCard 등 탄소 수치를 렌더링하는 컴포넌트는 이 문구를
 * 필수 prop 으로 받아 각주 없이는 렌더링되지 않게 한다.
 */
export const CARBON_DISCLAIMER = '예상 절감량 · 대체율 0.65 가정';

/** 계산식을 화면에 그대로 보여주기 위한 문자열 */
export const CARBON_FORMULA =
  '회피 탄소(kgCO₂e) = 무게(kg) × 섹터 탄소집약도 × 생산단계 비중 × 대체율(0.65)';

/**
 * 회피 탄소량을 계산한다.
 * @param weightKg 물품 무게 (kg)
 * @param sector   탄소 섹터
 * @returns kgCO₂e (소수 둘째 자리 반올림)
 */
export function calculateAvoidedCarbon(
  weightKg: number,
  sector: CarbonSector,
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return 0;
  const factor = SECTOR_FACTORS[sector].avoidanceFactor;
  return Math.round(weightKg * factor * 100) / 100;
}

/* ─────────────────── 표기 포맷 ─────────────────── */

/** 42.6 → "42.6 kgCO₂e" */
export function formatCarbon(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return `${rounded.toLocaleString('ko-KR')} kgCO₂e`;
}

/** 12000 → "12,000원" */
export function formatPrice(won: number): string {
  return won === 0 ? '무료나눔' : `${won.toLocaleString('ko-KR')}원`;
}

/** 3.5 → "3.5kg" */
export function formatWeight(kg: number): string {
  return `${(Math.round(kg * 10) / 10).toLocaleString('ko-KR')}kg`;
}

/* ─────────────────── 단위 환산 ─────────────────── */

export interface Equivalence {
  text: string;
  /** 환산에 사용한 계수의 출처. 화면에 함께 노출한다. */
  source: string;
}

/**
 * 30년생 소나무 1그루가 1년 동안 흡수하는 CO₂ 량 (kg).
 *
 * TODO(발표 전 확인): 산림청 공개 자료의 최신 수치로 교차검증할 것.
 *   기획서 R3 원칙("계수는 외부 공개 자료를 정제해 사용하고 팀이 임의로
 *   만들지 않는다")에 따라, 확인 전에는 환산 문구를 화면에 쓰지 않는다.
 *   확인되면 아래 값과 source 문자열을 함께 갱신한다.
 */
const PINE_CO2_PER_YEAR_KG = 6.6;
const PINE_SOURCE = '산림청 30년생 소나무 1그루 연간 흡수량 기준';

/**
 * 절감량을 "소나무 몇 그루가 1년간 흡수하는 양"으로 환산한다.
 * 이해를 돕기 위한 보조 표현일 뿐이므로, 반환값의 source 를
 * 반드시 함께 렌더링한다.
 */
export function toPineTreeEquivalence(kgCO2e: number): Equivalence | null {
  if (kgCO2e <= 0) return null;
  const trees = kgCO2e / PINE_CO2_PER_YEAR_KG;
  if (trees < 0.5) return null;

  return {
    text: `소나무 약 ${Math.round(trees).toLocaleString('ko-KR')}그루가 1년 동안 흡수하는 양과 비슷해요.`,
    source: PINE_SOURCE,
  };
}
