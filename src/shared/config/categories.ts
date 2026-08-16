/**
 * 거래 유형 · 상품 카테고리 · 상품 상태 · 탄소 섹터
 *
 * 값은 BE API 명세(Notion)를 따른다.
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

/** 목록 필터 칩 순서 (Figma 홈 피드 기준: 전체 / 판매 / 나눔 / 구합니다) */
export const TRADE_TYPE_FILTERS = [
  TRADE_TYPE.SALE,
  TRADE_TYPE.SHARE,
  TRADE_TYPE.WANTED,
] as const;

/* ─────────────────── 탄소 섹터 ─────────────────── */

/**
 * The Carbon Catalogue 를 정제해 만든 3개 섹터.
 *
 * 게시물의 `carbon_sector` 는 **서버가 내려준다** (LLM 정규화 결과).
 * 프론트에서 카테고리로부터 추론하지 않는다.
 */
export const CARBON_SECTOR = {
  HOME_LIVING: 'HOME_LIVING',
  ELECTRONICS: 'ELECTRONICS',
  BOOKS_PAPER: 'BOOKS_PAPER',
} as const;

export type CarbonSector = (typeof CARBON_SECTOR)[keyof typeof CARBON_SECTOR];

export const CARBON_SECTOR_LABEL: Record<CarbonSector, string> = {
  HOME_LIVING: '가구·생활용품',
  ELECTRONICS: '전자기기',
  BOOKS_PAPER: '종이·서적',
};

/* ─────────────────── 상품 카테고리 ─────────────────── */

/**
 * ⚠️ 명세 예시에 등장한 값은 `HOME_LIVING`, `ELECTRONICS` 둘뿐이다.
 *    나머지는 Figma 와이어프레임의 카테고리 칩(전자기기·생활용품·도서·의류)에서
 *    유추한 잠정값이므로, BE 담당자에게 Category Enum 전체 목록을 받아
 *    확정해야 한다. 확정 전까지 이 목록은 필터 UI 표시용으로만 쓴다.
 */
export const CATEGORIES = [
  { code: 'ELECTRONICS', label: '전자기기' },
  { code: 'HOME_LIVING', label: '생활용품' },
  { code: 'FURNITURE', label: '가구·인테리어' },
  { code: 'BOOKS', label: '도서·교재' },
  { code: 'CLOTHING', label: '의류·잡화' },
  { code: 'STATIONERY', label: '문구·사무' },
  { code: 'SPORTS', label: '스포츠·레저' },
  { code: 'ETC', label: '기타' },
] as const;

export type CategoryCode = (typeof CATEGORIES)[number]['code'];

const CATEGORY_LABEL = new Map<string, string>(
  CATEGORIES.map((c) => [c.code, c.label]),
);

export function categoryLabel(code: string): string {
  return CATEGORY_LABEL.get(code) ?? code;
}

/* ─────────────────── 상품 상태 ─────────────────── */

/**
 * ⚠️ 명세 예시에는 `GOOD` 만 등장한다. 나머지는 잠정값이므로
 *    BE Condition Enum 을 받아 확정해야 한다.
 */
export const ITEM_CONDITION = {
  NEW: 'NEW',
  LIKE_NEW: 'LIKE_NEW',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
} as const;

export type ItemCondition =
  (typeof ITEM_CONDITION)[keyof typeof ITEM_CONDITION];

export const ITEM_CONDITION_LABEL: Record<ItemCondition, string> = {
  NEW: '미개봉·새 상품',
  LIKE_NEW: '사용감 거의 없음',
  GOOD: '사용감 있음',
  FAIR: '사용감 많음',
};

/* ─────────────────── AI 보조 응답 ─────────────────── */

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
