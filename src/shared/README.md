# shared/

**어느 기능에서나 쓸 수 있는 것**만 넣습니다. 판단 기준은 하나입니다.

> "거래"나 "대여"를 몰라도 말이 되는가?

`Button` 은 거래를 몰라도 됩니다 → shared. `TradeDetail` 타입은 거래를
알아야 합니다 → `entities/`. 이 기준만 지키면 됩니다.

```
shared/
├─ api/      서버와 통신하는 배관
│   ├─ client.ts     axios 인스턴스 + 토큰/401 인터셉터
│   ├─ errors.ts     ApiError — 서버 오류를 한 가지 모양으로 정규화
│   └─ queryKeys.ts  TanStack Query 키 목록
│
├─ config/   값이 정해져 있는 상수 = "단일 출처" 파일들
│   ├─ status.ts      거래·대여 상태 코드 · 라벨 · 색상
│   ├─ navigation.ts  ROUTES · 탭 구성
│   └─ categories.ts  거래 유형 · 카테고리 · 상품 상태
│
├─ lib/      순수 함수 유틸
│   ├─ carbon.ts   탄소 계수 · 계산식 (출처 포함)
│   ├─ format.ts   날짜 · 시간 · 가격 표기
│   └─ cn.ts       조건부 className 결합
│
├─ store/
│   └─ authStore.ts  zustand — 로그인 상태만
│
└─ ui/       공통 컴포넌트
    Button · Field · Sheet · Toast · StatusBadge · TrustScoreBadge
    ItemCard · RentalCard · ImpactCards · FilterChips · feedback · icons
```

## 규칙 1 — 여기 있는 파일은 위쪽을 모릅니다

`shared/` 는 `features/` 를 절대 import 하지 않습니다. `entities/` 는
**타입만** 가져올 수 있습니다 (`api.ts` 의 호출 함수는 안 됩니다).

지금 그런 파일은 세 개뿐입니다.

```
ui/ItemCard.tsx    → entities/trade/types
ui/RentalCard.tsx  → entities/rental/types
store/authStore.ts → entities/user/types
```

카드 컴포넌트가 도메인 타입을 받는 건 화면 두 곳 이상에서 같은 카드를
쓰기 때문입니다. 대신 **데이터를 직접 불러오지는 않습니다** — 받아서
그리기만 합니다. 서버 호출은 언제나 화면(`features/`)이 시작합니다.

## 규칙 2 — "단일 출처" 파일은 우회하지 않습니다

같은 값이 화면마다 흩어지면, BE 가 값을 하나 바꿨을 때 고쳐야 할 곳을
전부 찾아다녀야 합니다. 그래서 아래 네 가지는 무조건 한 파일에서만 옵니다.

| 무엇 | 어디서 | 직접 쓰면 안 되는 것 |
| --- | --- | --- |
| 상태 코드·라벨·색 | `config/status.ts` | `'RESERVED'` 같은 문자열 |
| 주소 | `config/navigation.ts` | `'/trades/new'` 같은 경로 |
| 쿼리 키 | `api/queryKeys.ts` | `['trades', id]` 같은 배열 |
| 색·글자·모서리 | `src/index.css` `@theme` | `#4caf50` 같은 색상값 |

```ts
// ✗ if (post.status === 'RESERVED')
// ✓ if (post.status === TRADE_STATUS.RESERVED)
```

특히 쿼리 키는 오타가 나도 에러가 안 납니다. 대신 화면이 조용히 갱신되지
않습니다. 그게 기획서 R5(상태 동기화 오류)로 이어지기 때문에 배열
리터럴을 직접 쓰지 않습니다.

## 규칙 3 — 서버 데이터는 store 에 넣지 않습니다

`authStore` 에는 로그인 상태(userId, 닉네임, 캠퍼스, 신뢰도)만 있습니다.
게시물·대여·임팩트 같은 서버 데이터는 전부 TanStack Query 가 들고 있습니다.
같은 데이터를 두 곳이 들고 있으면 반드시 어긋납니다.

## 규칙 4 — 오류는 ApiError 한 가지 모양입니다

`client.ts` 의 인터셉터가 모든 실패를 `ApiError` 로 바꿔서 던집니다.
네트워크 장애·타임아웃처럼 응답 자체를 못 받은 경우는 `status: 0` 입니다.
그래서 화면에서는 `error instanceof ApiError` 하나만 보면 됩니다.

서버가 상태 전이를 거절할 때는 현재 상태까지 함께 알려주므로
`"지금은 신청할 수 없어요 (현재: 예약 중)"` 같은 안내가 가능합니다.

## ui/ 에 컴포넌트를 추가할 때

- 도메인 이름(trade, rental)이 props 에 등장하면 shared 가 아닙니다.
  해당 `features/` 폴더로 보내세요.
- 색은 Tailwind 토큰(`bg-brand-500`, `text-ink-700`)으로만 씁니다.
  Figma 값이 확정되면 `src/index.css` 의 `@theme` 블록만 갈아 끼웁니다.
- 클래스 조합은 `cn()` 을 쓰고, `className` prop 을 마지막에 이어 붙여
  쓰는 쪽에서 덮어쓸 수 있게 합니다.
