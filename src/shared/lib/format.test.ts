import { describe, expect, it } from 'vitest';

import { formatPrice } from './format';

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
