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

interface KakaoSize {
  /** 가로 픽셀 */
  width: number;
  /** 세로 픽셀 */
  height: number;
}

interface KakaoMarkerImage {
  /** SDK 가 내부적으로 사용하는 이미지 src */
  src: string;
}

interface KakaoMarkerImageOptions {
  /** 마커 이미지의 앵커 좌표(이미지 내 꼭짓점 위치). 기본값은 이미지 하단 중앙 */
  offset?: KakaoPoint;
}

interface KakaoPoint {
  x: number;
  y: number;
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
  setImage(image: KakaoMarkerImage): void;
  getPosition(): KakaoLatLng;
}

interface KakaoInfoWindow {
  open(map: KakaoMap, marker: KakaoMarker): void;
  close(): void;
  setContent(content: string | HTMLElement): void;
}

interface KakaoInfoWindowOptions {
  content?: string | HTMLElement;
  removable?: boolean;
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
  image?: KakaoMarkerImage;
}

interface KakaoMapsEvent {
  addListener(
    target: KakaoMarker | KakaoMap | KakaoInfoWindow,
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
  MarkerImage: new (
    src: string,
    size: KakaoSize,
    options?: KakaoMarkerImageOptions,
  ) => KakaoMarkerImage;
  InfoWindow: new (options?: KakaoInfoWindowOptions) => KakaoInfoWindow;
  LatLngBounds: new () => KakaoLatLngBounds;
  Size: new (width: number, height: number) => KakaoSize;
  Point: new (x: number, y: number) => KakaoPoint;
  event: KakaoMapsEvent;
}

interface KakaoNamespace {
  maps: KakaoMaps;
}

interface Window {
  kakao?: KakaoNamespace;
}
