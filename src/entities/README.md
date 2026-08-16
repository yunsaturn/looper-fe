# entities/

**BE 연동 시 수정하는 유일한 레이어입니다.**

```
entities/
├─ user/     { types.ts, api.ts }
├─ trade/    { types.ts, api.ts }
├─ rental/   { types.ts, api.ts }
└─ impact/   { types.ts, api.ts }
```

- `types.ts` — 서버 DTO 에 대응하는 TypeScript 타입
- `api.ts` — 엔드포인트 호출 함수 (axios 인스턴스 사용)

## 왜 이렇게 나눠 두었나

```
features/*  →  entities/*/api.ts  →  shared/api/client.ts  →  (MSW | 실제 BE)
```

BE(Spring Boot)가 아직 붙지 않은 상태에서도 화면을 끝까지 만들 수 있어야
하고, 명세가 도착했을 때 화면 코드를 건드리지 않고 갈아끼울 수 있어야
합니다. 그 교체 지점이 이 폴더입니다.

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
5. `mocks/handlers/` 의 경로도 같이 맞춥니다 (목업 폴백을 계속 살려두기 위해).
6. `.env` 에서 `VITE_USE_MOCK=false` 로 바꾸고 전체 흐름을 재검증합니다.
