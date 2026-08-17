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
 *  ⚠️ 계산식·계수·출처·기준일은 `GET /api/v1/carbon/references` 가,
 *     각주 문구는 임팩트 응답의 `disclaimer` 가 내려준다.
 *     화면은 그 값을 우선 쓰고, 이 파일의 상수는 응답이 없을 때의
 *     폴백과 등록 화면 미리보기 계산에만 쓴다.
 *     포맷터는 shared/lib/format.ts 에 모여 있다 — 여기에는 탄소 단위
 *     전용인 formatCarbon 만 둔다.
 * ─────────────────────────────────────────────────────────────
 */

import type { CarbonSector } from '@/shared/config/categories';

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

/** 42.6 → "42.6 kgCO₂e" */
export function formatCarbon(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return `${rounded.toLocaleString('ko-KR')} kgCO₂e`;
}
