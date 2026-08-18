/**
 * 픽업존 목록 API(GET /api/v1/campuses/{campusId}/pickup-zones) 전용 타입.
 *
 * 거래·대여 "상세" 응답에 들어가는 pickup_zone 은 { id, name } 요약형이라
 * (entities/trade/types.ts 의 PickupZone) 좌표 필드가 없을 수 있다. 그래서
 * 좌표를 필수로 넣는 대신, 목록 API 전용 타입을 여기에 따로 둔다. 두 타입을
 * 섞으면 상세 응답에서 없는 필드를 있다고 가정하게 되어 위험하다.
 */
export interface PickupZoneItem {
  id: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
}

/**
 * 좌표가 확실히 있는 픽업존. 지도 마커는 이 타입만 만든다.
 * hasCoordinates 로 좁힌 뒤에만 latitude/longitude 를 number 로 다룬다.
 */
export type LocatedPickupZone = PickupZoneItem & {
  latitude: number;
  longitude: number;
};

/**
 * 좌표가 둘 다 유효한지 판정하는 타입 가드.
 *
 * null 뿐 아니라 NaN·Infinity 같은 비정상 값도 걸러낸다. 좌표가 하나라도
 * 성립하지 않으면 마커를 만들면 안 되기 때문이다(BE 가 "교내 장소 협의"
 * 처럼 좌표 없는 픽업존을 내려보낸다).
 */
export function hasCoordinates(
  zone: PickupZoneItem,
): zone is LocatedPickupZone {
  return (
    zone.latitude !== null &&
    zone.longitude !== null &&
    Number.isFinite(zone.latitude) &&
    Number.isFinite(zone.longitude)
  );
}
