import { api } from '@/shared/api/client';

import type { ListingAssistRequest, ListingAssistResponse } from './types';

export const aiApi = {
  /**
   * 대표 이미지로 상품명·카테고리 후보와 설명 초안을 받는다.
   *
   * multipart/form-data 로 보내야 하며, Content-Type 은 브라우저가
   * boundary 와 함께 자동으로 붙이도록 비워 둔다.
   */
  listingAssist: ({ image, condition, user_title }: ListingAssistRequest) => {
    const form = new FormData();
    form.append('image', image);
    form.append('condition', condition);
    if (user_title) form.append('user_title', user_title);

    return api
      .post<ListingAssistResponse>('/api/v1/ai/listing-assist', form, {
        headers: { 'Content-Type': undefined },
        // 이미지 업로드 + 모델 추론 + LLM 호출이 이어지므로 기본 15초로는 짧다
        timeout: 30_000,
      })
      .then((r) => r.data);
  },
};
