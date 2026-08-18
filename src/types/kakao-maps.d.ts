/**
 * Kakao Maps JavaScript SDK 의 "쓰는 만큼만" 최소 전역 타입.
 *
 * 공식 타입 패키지를 받지 않고, 픽업존 선택에 실제로 호출하는 API 표면만
 * 손으로 선언한다. any 를 쓰지 않기 위한 목적이므로, 여기 없는 기능을
 * 쓰게 되면 그때 필요한 선언을 추가한다.
 *
 * import/export 가 없는 ambient 선언 파일이라 전역으로 합쳐진다.
 */

interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void;
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  setBounds(bounds: KakaoLatLngBounds): void;
  relayout(): void;
}

interface KakaoMapOptions {
  center: KakaoLatLng;
  /** 확대 수준. 작을수록 확대된다 */
  level?: number;
}

interface KakaoMarkerOptions {
  position: KakaoLatLng;
  map?: KakaoMap;
  title?: string;
}

interface KakaoMapsEvent {
  addListener(
    target: KakaoMarker | KakaoMap,
    type: string,
    handler: () => void,
  ): void;
}

interface KakaoMaps {
  /** autoload=false 로 로드했으므로 이 콜백이 끝나야 API 사용 가능 */
  load(callback: () => void): void;
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
  LatLngBounds: new () => KakaoLatLngBounds;
  event: KakaoMapsEvent;
}

interface KakaoNamespace {
  maps: KakaoMaps;
}

interface Window {
  kakao?: KakaoNamespace;
}
