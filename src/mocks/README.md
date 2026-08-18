# mocks/

MSW(Mock Service Worker) 기반 목업 서버입니다. 브라우저의 Service Worker 가
네트워크 요청을 가로채서 가짜 응답을 돌려줍니다. 화면 코드 입장에서는
진짜 서버와 구분되지 않습니다.

```
mocks/
├─ browser.ts     워커 기동 (VITE_USE_MOCK=true 일 때만)
├─ handlers.ts    요청 핸들러 — 어떤 주소에 뭘 돌려줄지
└─ seed.ts        시드 데이터 — 사용자 · 게시물 · 대여 · 임팩트
```

### 대여 전후 사진 비교 시연 데이터

로그인한 사용자가 **빌려주는 사람**인 `rental-16`은 이미 반납 사진이
등록된 `RETURN_PENDING` 상태입니다. `/rentals/rental-16` 상세에서 대여 전후
사진과 AI 비교 결과, 정상 반납 승인·문제 신고 흐름을 바로 확인할 수 있습니다.

`rental-10`은 기준 사진 등록 전의 `CONFIRMED` 상태로, 제공자 기준 사진 등록
화면을 확인하는 용도입니다.

## 두 가지 역할

**1. BE 없이 개발하기**

Spring Boot 서버가 준비되지 않은 시점에도 전체 화면을 끝까지 만들 수
있게 합니다. `.env` 의 `VITE_USE_MOCK=true` 로 켭니다.

**2. 시연 중 장애 폴백**

기획서 R2(콜드 스타트)·R4(AI 오인식 및 실패) 대응입니다. 시연 도중
서버나 AI 응답에 문제가 생기면 `VITE_USE_MOCK=true` 로 되돌려 녹화를
이어갈 수 있습니다.

이 폴백을 살려두려면, BE 를 붙인 뒤에도 `entities/*/api.ts` 를 고칠 때마다
`handlers.ts` 의 경로를 같이 맞춰 줘야 합니다.

## 켜지는 방식

```
main.tsx  →  await startMockWorker()  →  createRoot(...).render()
```

**워커를 먼저 켜고 나서** React 를 띄웁니다. 순서가 바뀌면 첫 화면의 요청이
워커를 지나쳐 실제 서버로 나가 버립니다.

`browser.ts` 는 `msw` 를 **동적 import** 로 불러옵니다. 정적 import 로 두면
`VITE_USE_MOCK=false` 인 실서버 빌드에도 msw 약 400KB 가 그대로 들어갑니다.

## handlers.ts

`/api/v1/*` 전부를 덮습니다.

```
auth · users            로그인 · 내 정보
meta                    학교 · 픽업존
trades                  목록 · 상세 · 등록 · 신청 · 수락 · 취소 · 완료 요청/확인
rentals                 목록 · 상세 · 등록 · 지원 · 수락 · 수령 · 반납 요청/확인
ai/listing-assist       이미지 → 제목·카테고리·설명 초안
images/presigned-uploads + 업로드 PUT
impact · carbon         내 임팩트 · 캠퍼스 임팩트 · 계수 출처
```

핸들러도 **상태 전이 규칙을 실제로 강제합니다.** 예를 들어 이미 예약 중인
게시물에 신청하면 `INVALID_STATE` 오류를 돌려줍니다. 목업이 다 받아 주면
실제 BE 로 갈아 끼웠을 때 처음 보는 오류 화면이 쏟아지기 때문입니다.

응답에는 180ms 지연을 넣어 로딩 상태와 스켈레톤을 눈으로 확인할 수 있게
했습니다.

## seed.ts

기획서가 요구한 **9개 상태를 모두 포함**해야 합니다. 목록이 비어 보이면
서비스가 작동하지 않는 것처럼 보이기 때문입니다.

```
거래 가능 · 신청 대기 · 미래 날짜 예약 중 · 거래 완료
모집 중 · 대여 확정 · 대여 중 · 반납 지연 · 반납 완료
```

`shared/config/status.ts` 의 `DEMO_REQUIRED_STATUSES` 에 목록과 각 상태의
출처가 정리돼 있습니다. (반납 지연은 상태가 아니라 `is_overdue` 플래그입니다)

시연 대본상 두 계정(작성자 / 신청자)으로 양쪽 관점을 보여줘야 하므로
해당 사용자에게는 고정 ID 를 부여합니다.

```ts
DEMO_ME_ID       // 로그인한 나
DEMO_PARTNER_ID  // 상대방
DEMO_CAMPUS_ID   // 기본 캠퍼스
```

모든 시드는 **가상 데이터**입니다. 실제 개인정보를 넣지 않습니다.

## 자주 하는 작업

| 하고 싶은 것 | 고칠 곳 |
| --- | --- |
| 목록에 물건 더 넣기 | `seed.ts` 의 `TRADE_SEEDS` / `RENTAL_SEEDS` |
| 오류 화면 확인 | 해당 핸들러 맨 위에서 `notFound()` 나 `invalidState(...)` 를 바로 return |
| 로딩 상태 오래 보기 | `handlers.ts` 의 `LATENCY_MS` |
| 새 엔드포인트 추가 | `handlers.ts` 에 `http.get/post` 추가 (경로는 `entities/*/api.ts` 와 동일하게) |

`public/mockServiceWorker.js` 는 MSW 가 생성한 파일입니다. 직접 수정하지
말고 msw 버전을 올렸을 때만 `npx msw init public/` 로 다시 만드세요.
