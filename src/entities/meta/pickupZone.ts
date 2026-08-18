import {
  hasCoordinates,
  type LocatedPickupZone,
  type PickupZoneItem,
} from './types';

/**
 * 픽업존 선택 로직의 순수 함수 모음.
 *
 * 지도(Kakao SDK)·DOM 에 의존하지 않는 계산만 모아 여기서 테스트한다.
 * 컴포넌트는 이 함수들을 조립하기만 한다.
 */

/**
 * BE 가 캠퍼스 중심 좌표를 아직 내려주지 않으므로, 좌표가 하나도 없을 때
 * 지도 중심으로 쓸 임시 좌표. 한국외대 서울캠퍼스 부근이다.
 *
 * TODO: BE 가 캠퍼스 응답에 중심 좌표(center_latitude/longitude)를 추가하면
 *       이 상수 대신 그 값을 쓴다.
 */
export interface MapCenter {
  latitude: number;
  longitude: number;
}

/** 선택 가능한 픽업존 = 활성(active) 픽업존. 지도·목록의 공통 모집단이다. */
export function activePickupZones(zones: PickupZoneItem[]): PickupZoneItem[] {
  return zones.filter((zone) => zone.active);
}

/** 지도 마커 대상 = 활성이면서 좌표가 둘 다 유효한 픽업존만. */
export function markerPickupZones(
  zones: PickupZoneItem[],
): LocatedPickupZone[] {
  return zones.filter(
    (zone): zone is LocatedPickupZone => zone.active && hasCoordinates(zone),
  );
}

/**
 * 지도 중심 좌표를 정한다.
 *   1) 현재 선택된 좌표 보유 픽업존
 *   2) 첫 번째 좌표 보유 픽업존
 *   3) fallback 중심 좌표
 */
export function resolveMapCenter(
  zones: PickupZoneItem[],
  selectedId: string,
  fallback?: MapCenter,
): MapCenter {
  const located = markerPickupZones(zones);

  const selected = located.find((zone) => zone.id === selectedId);
  if (selected) {
    return { latitude: selected.latitude, longitude: selected.longitude };
  }

  const first = located[0];
  if (first) {
    return { latitude: first.latitude, longitude: first.longitude };
  }

  return fallback ?? { latitude: 0, longitude: 0 };
}

/**
 * 선택된 id 가 여전히 유효한지 검사한다.
 *
 * 픽업존 목록이 갱신되어 선택했던 존이 사라지거나 비활성화되면, 그 id 를
 * 그대로 제출하면 안 된다(BE 가 거절한다). 유효하면 그대로, 아니면 빈
 * 문자열을 돌려주어 호출부가 선택을 초기화하게 한다.
 */
export function sanitizeSelectedZoneId(
  zones: PickupZoneItem[],
  selectedId: string,
): string {
  if (!selectedId) return '';
  const stillSelectable = activePickupZones(zones).some(
    (zone) => zone.id === selectedId,
  );
  return stillSelectable ? selectedId : '';
}

/** id 로 픽업존 하나를 찾는다(선택 요약 표시용). */
export function findPickupZone(
  zones: PickupZoneItem[],
  zoneId: string,
): PickupZoneItem | undefined {
  return zones.find((zone) => zone.id === zoneId);
}

/** 마커 클릭과 목록 클릭이 같은 활성 픽업존 id 를 선택하도록 한다. */
export function selectPickupZone(
  zones: PickupZoneItem[],
  zoneId: string,
): string {
  return activePickupZones(zones).some((zone) => zone.id === zoneId)
    ? zoneId
    : '';
}

function hasFinalConsonant(value: string): boolean {
  const code = value.charCodeAt(value.length - 1);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

export function formatPickupZoneSummary(name: string): [string, string] {
  const particle = hasFinalConsonant(name) ? '을' : '를';
  return [
    `${name}${particle} 희망 장소로 선택했어요.`,
    '신청·지원 메시지에서 구체적인 교내 거래 장소를 협의하세요.',
  ];
}
