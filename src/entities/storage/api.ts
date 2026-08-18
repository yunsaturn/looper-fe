import axios from 'axios';

import { api } from '@/shared/api/client';

export interface PresignedUploadResponse {
  object_key: string;
  upload_url: string;
  /** 업로드 완료 후 거래 image_urls 에 저장할 공개 URL */
  public_url: string;
  expires_in_seconds: number;
  /** PUT 요청에 값까지 동일하게 넣어야 하는 헤더 */
  required_headers: Record<string, string>;
}

/** 허용 형식 — BE 가 image/jpeg, image/png, image/webp 만 받는다 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const storageApi = {
  presign: (file: File) =>
    api
      .post<PresignedUploadResponse>('/api/v1/images/presigned-uploads', {
        file_name: file.name,
        content_type: file.type,
        file_size: file.size,
      })
      .then((r) => r.data),

  /**
   * 이미지를 스토리지에 직접 올린다.
   *
   * API 서버를 거치지 않고 S3/MinIO 로 바로 PUT 하므로, 인증 인터셉터가
   * 붙은 공용 인스턴스가 아니라 별도 axios 를 쓴다. 서명 URL 에 Authorization
   * 헤더를 함께 보내면 서명 검증이 깨진다.
   */
  upload: async (file: File): Promise<string> => {
    const presigned = await storageApi.presign(file);
    await axios.put(presigned.upload_url, file, {
      headers: presigned.required_headers,
      timeout: 60_000,
    });
    return presigned.public_url;
  },
};
