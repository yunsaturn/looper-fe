import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({ api: client }));

import { rentalApi } from './rental/api';
import { tradeApi } from './trade/api';

describe('BE request body contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.post.mockResolvedValue({ data: {} });
  });

  it('always sends a JSON body for trade cancellation endpoints', async () => {
    await tradeApi.cancelApplication('trade-1', 'application-1');
    await tradeApi.cancelReservation('trade-1');

    expect(client.post).toHaveBeenNthCalledWith(
      1,
      '/api/v1/trades/trade-1/applications/application-1/cancel',
      {},
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      '/api/v1/trades/trade-1/reservation/cancel',
      {},
    );
  });

  it('always sends a JSON body for rental cancellation and return endpoints', async () => {
    await rentalApi.cancelOffer('rental-1', 'offer-1');
    await rentalApi.requestReturn('rental-1');
    await rentalApi.cancel('rental-1');

    expect(client.post).toHaveBeenNthCalledWith(
      1,
      '/api/v1/rentals/rental-1/offers/offer-1/cancel',
      {},
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      '/api/v1/rentals/rental-1/return/request',
      {},
    );
    expect(client.post).toHaveBeenNthCalledWith(
      3,
      '/api/v1/rentals/rental-1/cancel',
      {},
    );
  });
});
