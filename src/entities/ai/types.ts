import type { AiStatus, Category, ItemCondition } from '@/shared/config/categories';

/** 이미지 분류 모델이 제시한 품목 후보 (최대 3개, 신뢰도 내림차순) */
export interface AiCandidate {
  item_name: string;
  category: Category;
  /** 0~1 */
  confidence: number;
}

/**
 * POST /api/v1/ai/listing-assist 응답.
 *
 * ⚠️ AI 실패가 게시물 등록을 막지 않도록 서버는 **실패해도 HTTP 200** 을 준다.
 *    성공/저신뢰/장애가 전부 200 이고, 구분은 ai_status 와 fallback_required 로 한다.
 *    따라서 화면은 HTTP 오류가 아니라 이 두 필드를 보고 분기해야 한다.
 *    (기획서 R4 대응: AI 는 확정 판단이 아니라 입력 보조)
 */
export interface ListingAssistResponse {
  /** SUCCESS 일 때만 존재. 거래 등록 시 선택적으로 연결한다 */
  analysis_id: string | null;
  ai_status: AiStatus;
  /** 장애 폴백이면 빈 배열 */
  candidates: AiCandidate[];
  image_tags: string[];
  /** SUCCESS 일 때만 존재 */
  description_draft: string | null;
  /** SUCCESS 일 때만 존재 */
  carbon_sector: Category | null;
  /** true 면 직접 입력 화면으로 전환해야 한다 */
  fallback_required: boolean;
  /** 저신뢰·장애 안내 문구. 성공이면 null */
  message: string | null;
}

export interface ListingAssistRequest {
  image: File;
  condition: ItemCondition;
  /** 사용자가 이미 입력한 제목. 있으면 AI 1순위 후보보다 우선한다 */
  user_title?: string;
}
