/**
 * 거래 유형 · 카테고리 · 상품 상태 · 탄소 섹터
 *
 * 값은 BE 소스의 Java enum 과 1:1로 대조해 맞췄다.
 * (trade/domain/TradeType, global/domain/Category,
 *  global/domain/CarbonSector, global/domain/ItemCondition)
 */

/* ─────────────────── 거래 유형 ─────────────────── */

export const TRADE_TYPE = {
  /** 판매 — 가격 입력 */
  SALE: 'SALE',
  /** 나눔 — 서버가 price 를 0 으로 고정 */
  SHARE: 'SHARE',
  /** 구합니다 — 희망 가격은 선택값 */
  WANTED: 'WANTED',
} as const;

export type TradeType = (typeof TRADE_TYPE)[keyof typeof TRADE_TYPE];

export const TRADE_TYPE_LABEL: Record<TradeType, string> = {
  SALE: '판매',
  SHARE: '나눔',
  WANTED: '구합니다',
};

/** 목록 필터 칩 (Figma 홈 피드 기준: 전체 / 판매 / 나눔 / 구합니다) */
export const TRADE_TYPE_FILTERS = [
  TRADE_TYPE.SALE,
  TRADE_TYPE.SHARE,
  TRADE_TYPE.WANTED,
] as const;

/* ─────────────────── 카테고리 · 탄소 섹터 ─────────────────── */

/**
 * BE 의 `Category` 는 세 값뿐이고, `Category.toCarbonSector()` 가
 * `CarbonSector.valueOf(name())` 이라 **카테고리와 탄소 섹터가 같은 값**이다.
 * 따라서 프론트에서 카테고리 → 섹터 매핑 로직을 따로 둘 필요가 없다.
 */
export const CATEGORY = {
  HOME_LIVING: 'HOME_LIVING',
  ELECTRONICS: 'ELECTRONICS',
  BOOKS_PAPER: 'BOOKS_PAPER',
} as const;

export type Category = (typeof CATEGORY)[keyof typeof CATEGORY];

/** 탄소 섹터는 카테고리와 동일한 값 집합이다. */
export type CarbonSector = Category;
export const CARBON_SECTOR = CATEGORY;

export const CATEGORY_LABEL: Record<Category, string> = {
  HOME_LIVING: '가구·생활용품',
  ELECTRONICS: '전자기기',
  BOOKS_PAPER: '종이·서적',
};

/** 탄소 계산 화면에서도 같은 라벨을 쓴다. */
export const CARBON_SECTOR_LABEL = CATEGORY_LABEL;

export const CATEGORY_FILTERS = [
  CATEGORY.HOME_LIVING,
  CATEGORY.ELECTRONICS,
  CATEGORY.BOOKS_PAPER,
] as const;

export function categoryLabel(code: string): string {
  return CATEGORY_LABEL[code as Category] ?? code;
}

/* ─────────────────── 상품 상태 ─────────────────── */

export const ITEM_CONDITION = {
  NEW: 'NEW',
  LIKE_NEW: 'LIKE_NEW',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  POOR: 'POOR',
} as const;

export type ItemCondition =
  (typeof ITEM_CONDITION)[keyof typeof ITEM_CONDITION];

export const ITEM_CONDITION_LABEL: Record<ItemCondition, string> = {
  NEW: '미개봉·새 상품',
  LIKE_NEW: '사용감 거의 없음',
  GOOD: '사용감 있음',
  FAIR: '사용감 많음',
  POOR: '하자 있음',
};

export const ITEM_CONDITIONS = Object.values(ITEM_CONDITION);

/* ─────────────────── AI 보조 ─────────────────── */

/**
 * AI 실패가 게시물 등록을 막지 않도록 서버는 실패해도 HTTP 200 을 주고
 * `ai_status` 와 `fallback_required` 로 알려준다. (기획서 R4 대응)
 */
export const AI_STATUS = {
  SUCCESS: 'SUCCESS',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type AiStatus = (typeof AI_STATUS)[keyof typeof AI_STATUS];
