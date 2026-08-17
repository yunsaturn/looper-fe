/**
 * BE 공통 오류 응답 (global/exception/ErrorResponse.java)
 *
 * Jackson 이 SNAKE_CASE 이므로 와이어에서는 field_errors 형태로 온다.
 * 상태 전이 실패 시 서버가 현재 상태와 허용 상태를 함께 알려주므로,
 * "지금은 신청할 수 없어요 (현재: 예약 중)" 같은 정확한 안내가 가능하다.
 */

/** global/exception/ErrorCode.java 와 1:1 */
export const ERROR_CODE = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_SCHOOL_EMAIL: 'INVALID_SCHOOL_EMAIL',
  INVALID_VERIFICATION_CODE: 'INVALID_VERIFICATION_CODE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INVALID_STATE: 'INVALID_STATE',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  TRADE_NOT_AVAILABLE: 'TRADE_NOT_AVAILABLE',
  APPLICATION_NOT_PENDING: 'APPLICATION_NOT_PENDING',
  RESERVATION_CANCEL_REQUIRED: 'RESERVATION_CANCEL_REQUIRED',
  APPLICATION_ALREADY_ACCEPTED: 'APPLICATION_ALREADY_ACCEPTED',
  OFFER_NOT_PENDING: 'OFFER_NOT_PENDING',
  RENTAL_CANCEL_REQUIRED: 'RENTAL_CANCEL_REQUIRED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  VERIFICATION_EXPIRED: 'VERIFICATION_EXPIRED',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  field_errors: FieldError[];
  /** 상태 전이 실패 시 리소스의 현재 상태 */
  current_status: string | null;
  /** 해당 작업이 허용되는 상태 목록 */
  allowed_statuses: string[] | null;
  /** 서버가 식별한 요청 작업명 */
  requested_action: string | null;
}

/**
 * 화면에서 다루기 쉬운 형태로 정규화한 오류.
 * axios 인터셉터가 모든 실패 응답을 이 타입으로 바꿔서 reject 한다.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors: FieldError[];
  readonly currentStatus: string | null;
  readonly allowedStatuses: string[] | null;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message ?? '알 수 없는 오류가 발생했습니다.');
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code ?? ERROR_CODE.INTERNAL_SERVER_ERROR;
    this.fieldErrors = body.field_errors ?? [];
    this.currentStatus = body.current_status ?? null;
    this.allowedStatuses = body.allowed_statuses ?? null;
  }

  /** 특정 필드의 검증 오류 메시지 */
  fieldError(field: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === field)?.message;
  }

  /** 인증이 풀린 상황인지 */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /**
   * 요청 제한에 걸렸는지.
   *
   * BE 가 인증 엔드포인트에 고정 윈도 제한을 걸어두었다.
   * (로그인 20회/분, 인증번호 발송 5회/시간, 확인 30회/분,
   *  같은 인증 건 5회 실패 시 차단)
   * 시연 중 로그인을 반복하면 걸릴 수 있으므로 안내를 따로 준다.
   */
  get isRateLimited(): boolean {
    return this.status === 429 || this.code === ERROR_CODE.TOO_MANY_REQUESTS;
  }
}

/** 네트워크 장애 등 응답 자체를 못 받은 경우 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}
