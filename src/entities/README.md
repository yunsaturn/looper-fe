# entities/

**BE 연동 시 수정하는 유일한 레이어입니다.**

화면과 서버 사이에 낀 얇은 층입니다. 여기가 있으면 서버 주소나 응답
모양이 바뀌어도 화면 코드는 그대로 둘 수 있습니다.

```
features/*  →  entities/*/api.ts  →  shared/api/client.ts  →  (MSW | 실제 BE)
   화면            주소·타입             axios 인스턴스
```

```
entities/
├─ user/     { types.ts, api.ts }   로그인 · 내 정보 · 다른 사용자 프로필
├─ trade/    { types.ts, api.ts }   거래 게시물 · 신청 · 예약 · 완료
├─ rental/   { types.ts, api.ts }   대여 요청 · 지원 · 수령 · 반납
├─ impact/   { types.ts, api.ts }   내 임팩트 · 캠퍼스 임팩트 · 계수 출처
├─ ai/       { types.ts, api.ts }   이미지 → 제목·카테고리·설명 초안
├─ meta/     { api.ts }             학교 · 캠퍼스 · 픽업존 목록
└─ storage/  { api.ts }             이미지 업로드 (presigned URL)
```

- `types.ts` — 서버 DTO 에 대응하는 TypeScript 타입
- `api.ts` — 엔드포인트 호출 함수 (`shared/api/client.ts` 의 axios 인스턴스 사용)

`meta/` 와 `storage/` 는 타입이 몇 개 안 돼서 `api.ts` 안에 같이 뒀습니다.

## 규칙

**1. 화면은 `api.ts` 만 부릅니다**

화면에서 `axios` 를 직접 import 하지 않습니다. 그러면 토큰 자동 첨부와
401 처리를 놓칩니다.

**2. 필드 이름은 snake_case 그대로 씁니다**

BE 가 Jackson SNAKE_CASE 라서 `image_urls`, `total_elements` 처럼 옵니다.
camelCase 로 바꾸는 변환 계층은 두지 않습니다. 변환을 넣으면 서버 명세와
코드가 어긋났을 때 어느 쪽 이름으로 검색해야 할지 알 수 없어집니다.

**3. AI 는 Spring Boot 를 거쳐서 부릅니다**

`ai/api.ts` 도 `/api/v1/ai/listing-assist` 로 Spring Boot 를 부릅니다.
FastAPI 는 Private 이라 프론트에서 직접 닿을 수 없습니다.
이미지 업로드 + 모델 추론 + LLM 호출이 이어지므로 이 호출만 타임아웃이
30초입니다. (기본 15초)

**4. 목록 응답은 전부 같은 모양입니다**

```ts
PageResponse<T> = { content, page, size, total_elements, has_next }
```

`shared/api/client.ts` 에 정의돼 있습니다.

## Swagger JSON 도착 후 교체 절차

```bash
# 1. BE 담당자에게 받은 파일을 저장
#    (BE 쪽에서: curl http://localhost:8080/v3/api-docs -o api-spec.json)
mkdir -p docs && cp ~/Downloads/api-spec.json docs/

# 2. 타입 자동 생성
npm run gen:api        # → src/shared/api/schema.d.ts
```

3. `types.ts` 의 본문을 `schema.d.ts` 파생 별칭으로 교체합니다.

```ts
import type { components } from '@/shared/api/schema';
export type TradePost = components['schemas']['TradePostResponse'];
```

이게 가능하려면 화면 코드가 **항상 `@/entities/*/types` 에서만** 타입을
가져와야 합니다. `schema.d.ts` 를 화면에서 직접 import 하지 마세요.

4. `api.ts` 의 경로·메서드를 실제 명세에 맞춥니다.
5. `mocks/handlers.ts` 의 경로도 같이 맞춥니다 (목업 폴백을 계속 살려두기 위해).
6. `.env` 에서 `VITE_USE_MOCK=false` 로 바꾸고 전체 흐름을 재검증합니다.

`docs/api-spec.json` 이 아직 없어서 `npm run gen:api` 는 지금은 실패합니다.
현재 `types.ts` 들은 BE 소스의 Java 클래스를 보고 손으로 맞춰 둔 상태입니다.
