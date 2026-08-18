/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Kakao Maps JavaScript SDK 공개 클라이언트 키.
   * 브라우저에 노출되는 값이며, 접근 제한은 Kakao Developers 의
   * 허용 도메인 등록으로 건다. 없으면 지도는 목록 선택으로 폴백한다.
   */
  readonly VITE_KAKAO_JAVASCRIPT_KEY?: string;
}
