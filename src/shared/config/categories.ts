/**
 * 거래 유형 · 상품 카테고리 · 탄소 섹터 매핑
 *
 * 카테고리는 화면의 필터·등록 폼에서 쓰이고,
 * 탄소 섹터는 절감량 계산의 계수 선택에 쓰인다.
 * 자유 입력된 품목명을 3개 섹터 중 하나로 정규화하는 일은
 * 서버(LLM)가 담당하며, 프론트는 서버가 내려준 섹터를 그대로 쓴다.
 *
 * ⚠️ 코드값은 BE Enum 과 일치시켜야 한다. (Swagger 도착 후 확정)
 */

/* ─────────────────── 거래 유형 ─────────────────── */

export const TRADE_TYPE = {
  /** 판매 — 가격 입력 */
  SALE: 'SALE',
  /** 나눔 — 가격이 0원으로 자동 처리 */
  GIVEAWAY: 'GIVEAWAY',
  /** 구합니다 — 희망 가격 선택 입력 */
  WANTED: 'WANTED',
} as const;

export type TradeType = (typeof TRADE_TYPE)[keyof typeof TRADE_TYPE];

export const TRADE_TYPE_LABEL: Record<TradeType, string> = {
  SALE: '중고거래',
  GIVEAWAY: '무료나눔',
  WANTED: '구합니다',
};

/* ─────────────────── 탄소 섹터 ─────────────────── */

/**
 * The Carbon Catalogue 를 정제해 만든 3개 섹터.
 * 개별 제품값은 편차가 최대 478배라 쓰지 않고 섹터 중앙값만 사용한다.
 */
export const CARBON_SECTOR = {
  FURNITURE_LIVING: 'FURNITURE_LIVING',
  ELECTRONICS: 'ELECTRONICS',
  PAPER_BOOK: 'PAPER_BOOK',
} as const;

export type CarbonSector =
  (typeof CARBON_SECTOR)[keyof typeof CARBON_SECTOR];

export const CARBON_SECTOR_LABEL: Record<CarbonSector, string> = {
  FURNITURE_LIVING: '가구·생활용품',
  ELECTRONICS: '전자기기',
  PAPER_BOOK: '종이·서적',
};

/* ─────────────────── 상품 카테고리 ─────────────────── */

export interface CategoryMeta {
  code: string;
  label: string;
  /** 탄소 계산 시 사용할 섹터 */
  sector: CarbonSector;
}

export const CATEGORIES = [
  { code: 'FURNITURE', label: '가구·인테리어', sector: 'FURNITURE_LIVING' },
  { code: 'LIVING', label: '생활용품', sector: 'FURNITURE_LIVING' },
  { code: 'APPLIANCE', label: '가전', sector: 'ELECTRONICS' },
  { code: 'DIGITAL', label: '디지털·PC', sector: 'ELECTRONICS' },
  { code: 'BOOK', label: '교재·도서', sector: 'PAPER_BOOK' },
  { code: 'STATIONERY', label: '문구·사무', sector: 'PAPER_BOOK' },
  { code: 'CLOTHING', label: '의류·잡화', sector: 'FURNITURE_LIVING' },
  { code: 'SPORTS', label: '스포츠·레저', sector: 'FURNITURE_LIVING' },
  { code: 'ETC', label: '기타', sector: 'FURNITURE_LIVING' },
] as const satisfies readonly CategoryMeta[];

export type CategoryCode = (typeof CATEGORIES)[number]['code'];

const CATEGORY_BY_CODE = new Map<string, CategoryMeta>(
  CATEGORIES.map((c) => [c.code, c]),
);

export function findCategory(code: string): CategoryMeta | undefined {
  return CATEGORY_BY_CODE.get(code);
}

export function categoryLabel(code: string): string {
  return CATEGORY_BY_CODE.get(code)?.label ?? '기타';
}

/** 카테고리 코드로 탄소 섹터를 찾는다. 서버가 섹터를 내려주면 그 값을 우선한다. */
export function sectorOfCategory(code: string): CarbonSector {
  return CATEGORY_BY_CODE.get(code)?.sector ?? 'FURNITURE_LIVING';
}

/* ─────────────────── 상품 상태 ─────────────────── */

export const ITEM_CONDITION = {
  UNUSED: 'UNUSED',
  LIKE_NEW: 'LIKE_NEW',
  USED: 'USED',
  WORN: 'WORN',
} as const;

export type ItemCondition =
  (typeof ITEM_CONDITION)[keyof typeof ITEM_CONDITION];

export const ITEM_CONDITION_LABEL: Record<ItemCondition, string> = {
  UNUSED: '미개봉·새 상품',
  LIKE_NEW: '사용감 거의 없음',
  USED: '사용감 있음',
  WORN: '사용감 많음',
};
