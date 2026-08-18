/**
 * 통합 검색.
 *
 * 서버가 형태소 정규화와 동의어 확장을 거쳐 거래·대여를 함께 찾아준다.
 * `normalized_query` 와 `expanded_terms` 는 "왜 이 결과가 나왔는지"를
 * 사용자에게 보여주기 위한 값이다 — 검색이 기대와 다를 때 납득시킨다.
 */

/** search/domain/SearchScope.java 와 1:1 */
export const SEARCH_SCOPE = {
  ALL: 'ALL',
  TRADE: 'TRADE',
  RENTAL: 'RENTAL',
} as const;

export type SearchScope = (typeof SEARCH_SCOPE)[keyof typeof SEARCH_SCOPE];

export const SEARCH_SCOPE_LABEL: Record<SearchScope, string> = {
  ALL: '전체',
  TRADE: '거래',
  RENTAL: '대여',
};

export interface SearchResultItem {
  resource_type: 'TRADE' | 'RENTAL';
  id: string;
  title: string;
  thumbnail_url?: string;
  /** 관련도 점수 */
  score: number;
}

export interface SearchResponse {
  original_query: string;
  normalized_query: string;
  /** 서버가 동의어로 넓힌 검색어들 */
  expanded_terms?: string[];
  results?: SearchResultItem[];
  page: number;
  size: number;
  total_elements: number;
  /** 추천 검색어 */
  suggestions?: string[];
}

export interface SearchParams {
  query: string;
  scope?: SearchScope;
  page?: number;
  size?: number;
}
