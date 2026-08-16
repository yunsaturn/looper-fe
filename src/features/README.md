# features/

화면 단위 코드가 들어가는 곳입니다. 각 폴더 = 하나의 기능 영역.

```
features/
├─ auth/     로그인 · 회원가입 · 프로필 설정
├─ trade/    거래 (판매/나눔/구합니다)
├─ rent/     대여 (역방향 단기 대여)
└─ impact/   탄소 절감 대시보드
```

각 폴더는 다음을 담습니다.

- `pages/` — 라우트에 직접 연결되는 화면 컴포넌트
- `components/` — 그 화면에서만 쓰는 컴포넌트
- `queries.ts` — TanStack Query 훅 (useQuery / useMutation)

## 규칙 1 — features 끼리 서로 import 하지 않습니다

`features/trade/` 가 `features/rent/` 의 무언가를 쓰고 싶어지면, 그건
공용이라는 뜻입니다. `shared/` 나 `entities/` 로 올린 다음 양쪽에서
가져다 쓰세요.

이 규칙을 지키면 나중에 `features/rent/` 폴더를 통째로 다른 사람에게
넘겨도 충돌이 나지 않습니다. (FE 2인 분담 대비)

예외는 `app/router.tsx` 하나뿐입니다. 라우터는 모든 features 를 가져옵니다.

## 규칙 2 — 서버 상태를 낙관적으로 바꾸지 않습니다

기획서 R5(상태 동기화 오류) 대응입니다. 중복 수락·이중 완료 처리를
막기 위해 상태 전이 규칙은 서버가 강제하고, 프론트는 서버 응답 상태를
그대로 렌더링합니다.

mutation 이 성공하면 `queryClient.invalidateQueries()` 로 다시 조회하세요.
`setQueryData` 로 미리 바꿔치기하지 않습니다.

## 규칙 3 — 상태 문자열을 직접 쓰지 않습니다

```ts
// ✗ 하지 마세요
if (post.status === 'RESERVED') ...

// ✓ 이렇게
import { TRADE_STATUS } from '@/shared/config/status';
if (post.status === TRADE_STATUS.RESERVED) ...
```

BE Enum 값이 바뀌면 `shared/config/status.ts` 한 곳만 고치면 됩니다.
