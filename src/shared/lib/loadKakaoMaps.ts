/**
 * Kakao Maps JavaScript SDK 싱글턴 로더.
 *
 * 외부 React 래퍼 라이브러리를 쓰지 않고 SDK 를 직접 로드한다. 같은
 * 페이지에서 여러 컴포넌트(거래·대여 등록)가 동시에 불러도 <script> 는 한
 * 번만 삽입되고, React Strict Mode 의 이중 마운트에도 안전하다.
 *
 * autoload=false 로 받은 뒤 window.kakao.maps.load() 가 끝나야 resolve 하므로,
 * resolve 된 시점에는 지도 API 를 바로 쓸 수 있다.
 *
 * 지도 로딩 실패가 등록 폼이나 목록 선택을 막으면 안 되므로, 실패는 예외로
 * 던지되 호출부가 목록 폴백으로 넘어갈 수 있게 유형을 구분한다. 실패한
 * 프라미스는 캐시하지 않아 "다시 시도"가 가능하다.
 */

const SCRIPT_ID = 'kakao-maps-sdk';

/** SDK 를 아직 쓸 수 없는 상태. 호출부는 이걸 잡아 목록 폴백으로 넘어간다. */
export class KakaoMapsUnavailableError extends Error {
  constructor(
    message: string,
    /** 'missing-key' | 'load-failed' | 'init-failed' */
    readonly reason: 'missing-key' | 'load-failed' | 'init-failed',
  ) {
    super(message);
    this.name = 'KakaoMapsUnavailableError';
  }
}

let loadPromise: Promise<KakaoNamespace> | null = null;

function sdkUrl(appKey: string): string {
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
}

/** window.kakao.maps.load() 까지 마친 뒤 resolve 한다. */
function finishLoad(
  resolve: (value: KakaoNamespace) => void,
  reject: (reason: Error) => void,
): void {
  const kakao = window.kakao;
  if (!kakao?.maps?.load) {
    reject(
      new KakaoMapsUnavailableError(
        'Kakao SDK 스크립트는 받았지만 초기화되지 않았어요.',
        'init-failed',
      ),
    );
    return;
  }
  kakao.maps.load(() => resolve(kakao));
}

export function loadKakaoMaps(): Promise<KakaoNamespace> {
  if (loadPromise) return loadPromise;

  const promise = new Promise<KakaoNamespace>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(
        new KakaoMapsUnavailableError(
          '브라우저 환경이 아니에요.',
          'load-failed',
        ),
      );
      return;
    }

    // 이미 완전히 로드된 경우
    if (window.kakao?.maps) {
      finishLoad(resolve, reject);
      return;
    }

    const appKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
    if (!appKey) {
      reject(
        new KakaoMapsUnavailableError(
          'VITE_KAKAO_JAVASCRIPT_KEY 가 설정되지 않았어요.',
          'missing-key',
        ),
      );
      return;
    }

    const onError = () =>
      reject(
        new KakaoMapsUnavailableError(
          'Kakao SDK 스크립트를 불러오지 못했어요.',
          'load-failed',
        ),
      );

    // <script> 중복 삽입 방지 — 이미 있으면 그 로드 완료를 기다린다
    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      if (window.kakao?.maps) {
        finishLoad(resolve, reject);
        return;
      }
      existing.addEventListener('load', () => finishLoad(resolve, reject), {
        once: true,
      });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = sdkUrl(appKey);
    script.addEventListener('load', () => finishLoad(resolve, reject), {
      once: true,
    });
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);
  });

  // 실패는 캐시하지 않는다 — 다음 호출(다시 시도)이 처음부터 다시 진행된다.
  promise.catch(() => {
    if (loadPromise === promise) loadPromise = null;
  });

  loadPromise = promise;
  return promise;
}
