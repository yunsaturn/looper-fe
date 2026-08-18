/**
 * TanStack Query 키 규약 단일 소스.
 *
 * mutation 성공 후 무엇을 무효화할지 판단하려면 키 구조가 한곳에
 * 정리돼 있어야 한다. 화면마다 배열 리터럴을 직접 쓰면 오타 하나로
 * 갱신이 안 되고, 그게 기획서 R5(상태 동기화 오류)로 이어진다.
 */

export const queryKeys = {
  me: ['me'] as const,
  user: (userId: string) => ['user', userId] as const,

  schools: ['schools'] as const,
  pickupZones: (campusId: string) => ['pickupZones', campusId] as const,

  trades: {
    all: ['trades'] as const,
    list: (filters: Record<string, unknown>) =>
      ['trades', 'list', filters] as const,
    detail: (tradeId: string) => ['trades', 'detail', tradeId] as const,
    applications: (tradeId: string) =>
      ['trades', 'applications', tradeId] as const,
  },

  rentals: {
    all: ['rentals'] as const,
    list: (filters: Record<string, unknown>) =>
      ['rentals', 'list', filters] as const,
    detail: (rentalId: string) => ['rentals', 'detail', rentalId] as const,
    offers: (rentalId: string) => ['rentals', 'offers', rentalId] as const,
  },

  impact: {
    all: ['impact'] as const,
    /* 기간이 키에 들어가야 필터를 바꿨을 때 다시 조회된다 */
    me: (period: object = {}) => ['impact', 'me', period] as const,
    campus: (campusId: string, period: object = {}) =>
      ['impact', 'campus', campusId, period] as const,
  },

  carbonReferences: ['carbon', 'references'] as const,

  search: (params: Record<string, unknown>) => ['search', params] as const,

  notifications: {
    list: ['notifications'] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
} as const;
