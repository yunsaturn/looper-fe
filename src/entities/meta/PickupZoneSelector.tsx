import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { loadKakaoMaps } from '@/shared/lib/loadKakaoMaps';

import {
  activePickupZones,
  findPickupZone,
  formatPickupZoneSummary,
  markerPickupZones,
  resolveMapCenter,
  sanitizeSelectedZoneId,
  selectPickupZone,
} from './pickupZone';
import type { LocatedPickupZone, PickupZoneItem } from './types';

/**
 * 거래·대여 등록에서 공용으로 쓰는 픽업존 선택 컴포넌트.
 *
 * 지도 마커와 아래 목록이 같은 value 를 공유한다. 지도는 좌표가 있는
 * 픽업존만 마커로 그리고, 좌표가 없거나 지도를 못 불러온 경우에도 목록으로
 * 항상 선택할 수 있다. 선택 결과는 zoneId 문자열이라 기존 pickup_zone_id
 * 전송 방식(변경 없음)에 그대로 맞는다.
 *
 * 이후 거래 수정·대여 수정 화면에서도 재사용할 수 있도록, 데이터 조회는
 * 하지 않고 zones 를 통째로 받는다.
 */

/* ── 커스텀 마커 SVG (인라인 Data URI) ── */

const DEFAULT_MARKER_SIZE = { w: 32, h: 44 } as const;
const SELECTED_MARKER_SIZE = { w: 38, h: 52 } as const;

function markerIndex(id: string): number {
  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) % 99;
  }
  return hash + 1;
}

function markerSvg(zone: LocatedPickupZone, selected: boolean): string {
  const size = selected ? SELECTED_MARKER_SIZE : DEFAULT_MARKER_SIZE;
  const center = size.w / 2;
  const radius = selected ? 19 : 16;
  const label = String(markerIndex(zone.id));
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">` +
      `<path d="M${center} 0C${center - radius} 0 0 ${radius * 0.95} 0 ${radius}c0 ${radius * 0.8} ${center} ${size.h} ${center} ${size.h}s${center}-${size.h * 0.2} ${center}-${size.h * 0.8}C${size.w} ${radius * 0.95} ${center + radius} 0 ${center} 0z" fill="${selected ? '#15803D' : '#22C55E'}" stroke="#ffffff" stroke-width="2"/>` +
      `<circle cx="${center}" cy="${radius}" r="${selected ? 10 : 9}" fill="#ffffff"/>` +
      `<text x="${center}" y="${radius + 4}" text-anchor="middle" font-family="sans-serif" font-size="${selected ? 12 : 11}" font-weight="700" fill="#166534">${label}</text>` +
      `</svg>`,
  )}`;
}

/** InfoWindow 안에 들어갈 HTML 을 생성한다. */
function buildInfoContent(zone: LocatedPickupZone): string {
  const desc = zone.description
    ? `<p style="margin:2px 0 0;font-size:11px;color:#6B7280;">${zone.description}</p>`
    : '';
  return (
    `<div style="padding:6px 10px;min-width:120px;max-width:200px;font-family:sans-serif;">` +
    `<p style="margin:0;font-size:13px;font-weight:600;color:#1F2937;">${zone.name}</p>` +
    desc +
    `</div>`
  );
}
export interface PickupZoneSelectorProps {
  zones: PickupZoneItem[];
  value: string;
  onChange: (zoneId: string) => void;
  /** 픽업존 조회 로딩 중 */
  loading?: boolean;
  /** 조회 실패 메시지 또는 필드 검증 오류(pickup_zone_id) */
  error?: string;
  /** 조회 실패 시 다시 시도 */
  onRetry?: () => void;
}

/** 지도 상태 — SDK 로드/초기화 진행 상황 */
type MapStatus = 'loading' | 'ready' | 'unavailable';

const MAP_CONTAINER_CLASS = 'h-60 w-full md:h-72';

export function PickupZoneSelector({
  zones,
  value,
  onChange,
  loading = false,
  error,
  onRetry,
}: PickupZoneSelectorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const infoWindowRef = useRef<KakaoInfoWindow | null>(null);
  /** 마커 id → KakaoMarker 맵. 선택 시 이미지 교체에 쓴다 */
  const markerMapRef = useRef<Map<string, KakaoMarker>>(new Map());
  /** 마커 클릭 핸들러가 항상 최신 onChange 를 부르도록 */
  const onChangeRef = useRef(onChange);

  const [sdk, setSdk] = useState<KakaoNamespace | null>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>('loading');

  const activeZones = useMemo(() => activePickupZones(zones), [zones]);
  const locatedZones = useMemo(() => markerPickupZones(zones), [zones]);
  const selected = findPickupZone(zones, value);
  const summary = selected ? formatPickupZoneSummary(selected.name) : null;

  const handleZoneSelect = (zoneId: string) => {
    onChange(selectPickupZone(zones, zoneId));
  };

  /** 마커 재생성 여부를 좌표 조합으로만 판단하기 위한 키 */
  const markerKey = useMemo(
    () =>
      locatedZones.map((z) => `${z.id}@${z.latitude},${z.longitude}`).join('|'),
    [locatedZones],
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /** SDK 기반 MarkerImage 생성 — sdk 가 준비된 뒤에만 호출 */
  const makeMarkerImage = useCallback(
    (zone: LocatedPickupZone, selected: boolean) => {
      if (!sdk) return undefined;
      const markerSize = selected ? SELECTED_MARKER_SIZE : DEFAULT_MARKER_SIZE;
      const src = markerSvg(zone, selected);
      const size = new sdk.maps.Size(markerSize.w, markerSize.h);
      const offset = new sdk.maps.Point(markerSize.w / 2, markerSize.h);
      return new sdk.maps.MarkerImage(src, size, { offset });
    },
    [sdk],
  );

  /* 선택된 존이 사라지거나 비활성화되면 잘못된 id 를 들고 있지 않게 초기화 */
  useEffect(() => {
    if (!value) return;
    const next = sanitizeSelectedZoneId(zones, value);
    if (next !== value) onChangeRef.current(next);
  }, [zones, value]);

  /* SDK 로드 — 페이지당 한 번. 실패하면 목록 폴백으로 넘어간다 */
  useEffect(() => {
    let cancelled = false;
    setMapStatus('loading');
    loadKakaoMaps()
      .then((loaded) => {
        if (!cancelled) setSdk(loaded);
      })
      .catch(() => {
        if (!cancelled) setMapStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* 지도 초기화 — SDK 준비 후 한 번. 초기 중심은 그 시점 값으로 잡는다 */
  useEffect(() => {
    if (!sdk || !containerRef.current) return;
    try {
      const center = resolveMapCenter(zones, value);
      mapRef.current = new sdk.maps.Map(containerRef.current, {
        center: new sdk.maps.LatLng(center.latitude, center.longitude),
        level: 4,
      });
      setMapStatus('ready');
    } catch {
      setMapStatus('unavailable');
    }
    return () => {
      mapRef.current = null;
    };
    // 초기 중심 계산에만 zones/value 를 쓰므로 SDK 준비 시 한 번만 만든다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk]);

  /* 마커 렌더링 — 좌표 조합이 바뀔 때마다 기존 마커를 지우고 다시 그린다 */
  useEffect(() => {
    const map = mapRef.current;
    if (!sdk || !map || mapStatus !== 'ready') return;
    const markerMap = markerMapRef.current;

    // 기존 정리
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    markerMapRef.current.clear();
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    const bounds = new sdk.maps.LatLngBounds();
    locatedZones.forEach((zone) => {
      const position = new sdk.maps.LatLng(zone.latitude, zone.longitude);
      const isSelected = zone.id === value;
      const image = makeMarkerImage(zone, isSelected);
      const marker = new sdk.maps.Marker({
        position,
        map,
        title: zone.name,
        image,
      });

      sdk.maps.event.addListener(marker, 'click', () => {
        onChangeRef.current(selectPickupZone(zones, zone.id));
      });

      markersRef.current.push(marker);
      markerMapRef.current.set(zone.id, marker);
      bounds.extend(position);
    });

    if (locatedZones.length > 0) {
      map.setBounds(bounds);
      map.setLevel(Math.min(7, Math.max(3, map.getLevel())));
    }

    // 선택된 마커가 있으면 InfoWindow 바로 열기
    const selectedZone = locatedZones.find((z) => z.id === value);
    if (selectedZone) {
      const selectedMarker = markerMapRef.current.get(selectedZone.id);
      if (selectedMarker) {
        const iw = new sdk.maps.InfoWindow({
          content: buildInfoContent(selectedZone),
          removable: false,
        });
        iw.open(map, selectedMarker);
        infoWindowRef.current = iw;
      }
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      markerMap.clear();
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, [sdk, mapStatus, markerKey, locatedZones, value, zones, makeMarkerImage]);

  /* 선택이 바뀌면 마커 이미지 교체 + InfoWindow 이동 + 지도 중심 이동 */
  useEffect(() => {
    const map = mapRef.current;
    if (!sdk || !map || mapStatus !== 'ready') return;

    // 모든 마커를 기본 이미지로 리셋
    locatedZones.forEach((zone) => {
      const marker = markerMapRef.current.get(zone.id);
      const image = makeMarkerImage(zone, false);
      if (marker && image) marker.setImage(image);
    });

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    const target = locatedZones.find((zone) => zone.id === value);
    if (target) {
      const marker = markerMapRef.current.get(target.id);
      if (marker) {
        const selectedImage = makeMarkerImage(target, true);
        if (selectedImage) marker.setImage(selectedImage);
        map.setCenter(new sdk.maps.LatLng(target.latitude, target.longitude));

        const iw = new sdk.maps.InfoWindow({
          content: buildInfoContent(target),
          removable: false,
        });
        iw.open(map, marker);
        infoWindowRef.current = iw;
      }
    }
  }, [sdk, mapStatus, value, locatedZones, makeMarkerImage]);

  /* ── 렌더 ── */

  const hasZones = activeZones.length > 0;

  return (
    <div className="grid gap-3">
      {/* 지도 영역 — SDK 를 못 쓰면 안내로 대체하고 목록은 계속 제공한다 */}
      {hasZones &&
        locatedZones.length > 0 &&
        (mapStatus === 'unavailable' ? (
          <div
            className={cn(
              MAP_CONTAINER_CLASS,
              'flex items-center justify-center rounded-card border border-dashed border-ink-200 bg-ink-50 px-6 text-center text-sm text-ink-500',
            )}
          >
            지도를 불러오지 못했지만, 아래 목록에서 장소를 선택할 수 있어요.
          </div>
        ) : (
          <div className="relative">
            <div
              ref={containerRef}
              className={cn(
                MAP_CONTAINER_CLASS,
                'overflow-hidden rounded-card border border-ink-200',
              )}
            />
            {mapStatus === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center rounded-card bg-white/70 text-sm text-ink-500">
                지도를 불러오는 중…
              </div>
            )}
          </div>
        ))}

      {/* 선택 목록 — 좌표 유무와 관계없이 모든 활성 픽업존을 담는다 */}
      {hasZones && locatedZones.length > 0 && (
        <p className="text-xs text-ink-500">
          교내 지정 픽업존에서만 물건을 주고받아요. 지도 마커나 목록에서
          고르세요.
        </p>
      )}
      {hasZones && locatedZones.length === 0 && (
        <p className="rounded-card border border-dashed border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
          등록된 좌표가 없어 목록에서 선택해 주세요.
        </p>
      )}
      {loading && !hasZones && (
        <div className="rounded-card border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-500">
          픽업존을 불러오는 중이에요.
        </div>
      )}
      {hasZones ? (
        <ul className="grid gap-2">
          {activeZones.map((zone) => {
            const isSelected = zone.id === value;
            return (
              <li key={zone.id}>
                <button
                  type="button"
                  onClick={() => handleZoneSelect(zone.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-btn border px-3 py-2.5 text-left transition-colors',
                    isSelected
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-ink-200 bg-white hover:border-brand-300',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full border',
                      isSelected
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-ink-300',
                    )}
                  />
                  <span className="min-w-0 grow whitespace-normal break-words">
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        isSelected ? 'text-brand-700' : 'text-ink-800',
                      )}
                    >
                      {zone.name}
                    </span>
                    {zone.description && (
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {zone.description}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        !error && (
          <div className="rounded-card border border-dashed border-ink-200 px-6 py-10 text-center text-sm text-ink-500">
            선택할 수 있는 픽업존이 없어요.
          </div>
        )
      )}

      {/* 선택 요약 */}
      {selected && summary && (
        <p className="grid gap-0.5 rounded-btn bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <span>{summary[0]}</span>
          <span>{summary[1]}</span>
        </p>
      )}

      {/* 오류 — 조회 실패(재시도 가능) 또는 필드 검증 오류 */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
          <span>{error}</span>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
