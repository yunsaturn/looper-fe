import { describe, expect, it } from 'vitest';

import { hasCoordinates, type PickupZoneItem } from './types';
import {
  activePickupZones,
  HUFS_SEOUL_FALLBACK_CENTER,
  markerPickupZones,
  resolveMapCenter,
  sanitizeSelectedZoneId,
} from './pickupZone';

/**
 * 픽업존 선택은 지도(Kakao SDK)와 목록 폴백을 동시에 다뤄서 화면 조건이
 * 많다. 그 분기를 좌우하는 판정만 순수 함수로 떼어 여기서 고정한다.
 */

const zone = (
  over: Partial<PickupZoneItem> & { id: string },
): PickupZoneItem => ({
  name: over.id,
  description: null,
  latitude: null,
  longitude: null,
  active: true,
  ...over,
});

const located1 = zone({ id: 'a', latitude: 37.5, longitude: 127.0 });
const located2 = zone({ id: 'b', latitude: 37.6, longitude: 127.1 });
const noCoord = zone({ id: 'c', latitude: null, longitude: null });
const inactive = zone({
  id: 'd',
  latitude: 37.7,
  longitude: 127.2,
  active: false,
});

describe('hasCoordinates', () => {
  it('좌표가 둘 다 있으면 통과', () => {
    expect(hasCoordinates(located1)).toBe(true);
  });

  it('둘 중 하나라도 null 이면 실패', () => {
    expect(
      hasCoordinates(zone({ id: 'x', latitude: 37.5, longitude: null })),
    ).toBe(false);
    expect(
      hasCoordinates(zone({ id: 'y', latitude: null, longitude: 127.0 })),
    ).toBe(false);
  });

  it('NaN·Infinity 같은 비정상 좌표도 걸러낸다', () => {
    expect(
      hasCoordinates(zone({ id: 'n', latitude: NaN, longitude: 127 })),
    ).toBe(false);
    expect(
      hasCoordinates(zone({ id: 'i', latitude: Infinity, longitude: 127 })),
    ).toBe(false);
  });
});

describe('markerPickupZones', () => {
  it('좌표가 모두 있는 활성 존만 마커 대상', () => {
    const zones = [located1, located2, noCoord, inactive];
    expect(markerPickupZones(zones).map((z) => z.id)).toEqual(['a', 'b']);
  });

  it('좌표가 있어도 비활성이면 마커 대상에서 제외', () => {
    expect(markerPickupZones([inactive])).toEqual([]);
  });
});

describe('activePickupZones', () => {
  it('좌표 없는 존도 목록(선택) 대상에는 포함', () => {
    const zones = [located1, noCoord, inactive];
    expect(activePickupZones(zones).map((z) => z.id)).toEqual(['a', 'c']);
  });
});

describe('resolveMapCenter', () => {
  const zones = [noCoord, located1, located2];

  it('선택된 좌표 보유 존이 있으면 그 좌표를 중심으로', () => {
    expect(resolveMapCenter(zones, 'b')).toEqual({
      latitude: 37.6,
      longitude: 127.1,
    });
  });

  it('선택이 없거나 좌표가 없으면 첫 좌표 보유 존', () => {
    expect(resolveMapCenter(zones, '')).toEqual({
      latitude: 37.5,
      longitude: 127.0,
    });
    // 선택은 됐지만 좌표가 없는 존이면 첫 좌표 보유 존으로 폴백
    expect(resolveMapCenter(zones, 'c')).toEqual({
      latitude: 37.5,
      longitude: 127.0,
    });
  });

  it('좌표 보유 존이 하나도 없으면 fallback 중심', () => {
    expect(resolveMapCenter([noCoord], '')).toEqual({
      latitude: HUFS_SEOUL_FALLBACK_CENTER.latitude,
      longitude: HUFS_SEOUL_FALLBACK_CENTER.longitude,
    });
  });
});

describe('sanitizeSelectedZoneId', () => {
  const zones = [located1, noCoord];

  it('선택 id 가 여전히 활성이면 그대로', () => {
    expect(sanitizeSelectedZoneId(zones, 'a')).toBe('a');
    expect(sanitizeSelectedZoneId(zones, 'c')).toBe('c');
  });

  it('선택 id 가 사라지거나 비활성화되면 빈 문자열로 초기화', () => {
    expect(sanitizeSelectedZoneId(zones, 'gone')).toBe('');
    expect(sanitizeSelectedZoneId([inactive], 'd')).toBe('');
  });

  it('빈 선택은 빈 선택으로', () => {
    expect(sanitizeSelectedZoneId(zones, '')).toBe('');
  });
});
