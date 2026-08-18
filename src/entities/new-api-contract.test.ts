import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({ api: client }));

import { notificationApi } from './notification/api';
import { searchApi } from './search/api';
import { impactApi } from './impact/api';
import { userApi } from './user/api';

/**
 * 신규 API 의 경로·메서드·파라미터 이름을 BE 컨트롤러와 고정한다.
 *
 * 여기서 잡고 싶은 건 타입이 아니라 **와이어 포맷**이다. 타입은 이미
 * tsc 가 본다. 반대로 `unread_only` 를 `unreadOnly` 로 보내는 실수는
 * 컴파일도 통과하고 목업도 통과한 뒤 실서버에서만 조용히 무시된다.
 */
describe('알림 API 계약', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: {} });
    client.patch.mockResolvedValue({ data: {} });
  });

  it('목록은 snake_case 쿼리 파라미터를 쓴다', async () => {
    await notificationApi.list({ unread_only: true, page: 0, size: 20 });
    expect(client.get).toHaveBeenCalledWith('/api/v1/notifications', {
      params: { unread_only: true, page: 0, size: 20 },
    });
  });

  it('미읽음 수는 별도 경로를 쓴다', async () => {
    await notificationApi.unreadCount();
    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/notifications/unread-count',
    );
  });

  it('읽음 처리는 PATCH 다 (POST 가 아니다)', async () => {
    await notificationApi.markRead('noti-1');
    expect(client.patch).toHaveBeenCalledWith(
      '/api/v1/notifications/noti-1/read',
    );

    await notificationApi.markAllRead();
    expect(client.patch).toHaveBeenCalledWith('/api/v1/notifications/read-all');
  });
});

describe('통합 검색 API 계약', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: {} });
  });

  it('query·scope·page·size 를 쿼리 파라미터로 보낸다', async () => {
    await searchApi.search({
      query: '계산기',
      scope: 'TRADE',
      page: 1,
      size: 20,
    });
    expect(client.get).toHaveBeenCalledWith('/api/v1/search', {
      params: { query: '계산기', scope: 'TRADE', page: 1, size: 20 },
    });
  });
});

describe('임팩트 API 계약', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: {} });
  });

  it('계산 근거는 activityId 경로를 쓴다', async () => {
    await impactApi.activity('act-1');
    expect(client.get).toHaveBeenCalledWith('/api/v1/impact/activities/act-1');
  });

  it('기간 필터는 from·to 로 나간다', async () => {
    await impactApi.me({ from: '2026-08-01', to: '2026-08-31' });
    expect(client.get).toHaveBeenCalledWith('/api/v1/impact/me', {
      params: { from: '2026-08-01', to: '2026-08-31' },
    });
  });
});

describe('회원 탈퇴 API 계약', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.delete.mockResolvedValue({ data: {} });
  });

  it('DELETE 인데도 본문을 실어 보낸다 (axios 는 data 옵션이 필요하다)', async () => {
    await userApi.withdraw({ password: 'pw', confirmation: 'DELETE' });
    expect(client.delete).toHaveBeenCalledWith('/api/v1/users/me', {
      data: { password: 'pw', confirmation: 'DELETE' },
    });
  });
});
