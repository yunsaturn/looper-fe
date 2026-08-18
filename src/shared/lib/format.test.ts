import { describe, expect, it } from 'vitest';

import { formatAmount, formatPrice } from './format';

describe('formatPrice', () => {
  it('formats paid and free prices', () => {
    expect(formatPrice(12_000)).toBe('12,000원');
    expect(formatPrice(0)).toBe('무료');
  });

  it('handles nullable prices omitted by the BE non-null serializer', () => {
    expect(formatPrice(null)).toBe('가격 협의');
    expect(formatPrice(undefined)).toBe('가격 협의');
  });
});

describe('formatAmount', () => {
  it('formats accumulated amounts, keeping 0 as 0원', () => {
    expect(formatAmount(47_000)).toBe('47,000원');
    // 합계 0원은 '무료'가 아니라 '아직 없음'이다
    expect(formatAmount(0)).toBe('0원');
  });

  it('treats a missing amount as 0원', () => {
    expect(formatAmount(null)).toBe('0원');
    expect(formatAmount(undefined)).toBe('0원');
  });
});
