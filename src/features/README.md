# features/

실제 화면이 들어가는 곳입니다. **폴더 하나 = 기능 영역 하나.**

```
features/
├─ auth/    LoginPage
│
├─ home/    HomePage                    홈 피드 (최근 게시물 + 임팩트 카드)
│
├─ trade/   거래 — 판매 / 나눔 / 구합니다
│   ├─ TradeListPage       목록 · 검색 · 필터
│   ├─ TradeDetailPage     상세 + 신청 · 수락 · 완료 확인
│   ├─ TradeNewPage        등록
│   ├─ TradeApplicantsPage 신청자 목록 (작성자용)
│   ├─ TradeCompletePage   거래 완료 결과
│   └─ AiAssistField       사진 한 장 → 제목·카테고리·설명 초안 (등록 화면에서 사용)
│
├─ rent/    대여 — 필요한 사람이 먼저 올리고 가진 사람이 지원하는 역방향 구조
│   ├─ RentalListPage      목록
│   ├─ RentalDetailPage    상세 + 지원 · 수령 · 반납
│   ├─ RentalNewPage       요청 등록
│   ├─ RentalOffersPage    지원자 목록 (요청자용)
│   └─ RentalCompletePage  반납 완료 결과
│
├─ impact/  ImpactPage(탄소 절감 대시보드) · ImpactMethodPage(계산식 설명)
│
└─ misc/    PlaceholderPage — 아직 안 만든 화면을 대신 채워 주는 컴포넌트
```

## 파일 배치

지금은 **폴더 하나에 파일을 평평하게** 두고 있습니다. 화면 수가 많지 않아서
`pages/`, `components/` 로 한 번 더 나누면 오히려 찾기 번거롭기 때문입니다.

- 라우트에 붙는 화면은 `~Page.tsx`
- 그 화면에서만 쓰는 컴포넌트는 이름 그대로 (`AiAssistField.tsx`)
- 다른 기능 폴더에서도 쓰고 싶어지면 → `shared/ui/` 로 올립니다

TanStack Query 훅(`useQuery` / `useMutation`)은 별도 `queries.ts` 없이 쓰는
화면 안에 바로 둡니다. 같은 쿼리를 두 화면이 쓰게 되면 그때 파일로 빼세요.

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

```ts
const { mutate } = useMutation({
  mutationFn: () => tradeApi.apply(tradeId, message),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trades.detail(tradeId) });
  },
});
```

무효화할 키는 `shared/api/queryKeys.ts` 에서 가져옵니다.

## 규칙 3 — 상태 문자열을 직접 쓰지 않습니다

```ts
// ✗ 하지 마세요
if (post.status === 'RESERVED') ...

// ✓ 이렇게
import { TRADE_STATUS } from '@/shared/config/status';
if (post.status === TRADE_STATUS.RESERVED) ...
```

BE Enum 값이 바뀌면 `shared/config/status.ts` 한 곳만 고치면 됩니다.
라벨·색상도 같은 파일에서 옵니다 — 화면에서 `'예약 중'` 같은 한국어를
직접 쓰지 말고 `StatusBadge` 를 쓰세요.

주소도 마찬가지입니다. `navigate('/trades/new')` 대신
`navigate(ROUTES.TRADE_NEW)` 를 씁니다.

## 규칙 4 — 세 가지 상태를 항상 그립니다

데이터를 불러오는 화면은 **로딩 / 비어 있음 / 오류**를 모두 처리합니다.
공통 컴포넌트가 `shared/ui/feedback.tsx` 에 있습니다.

```tsx
if (isLoading) return <CardSkeletonGrid />;
if (error) return <ErrorState error={error} onRetry={refetch} />;
if (!items.length) return <EmptyState title="아직 등록된 물건이 없어요" />;
```

목업 서버가 일부러 180ms 지연을 주기 때문에 로딩 상태를 눈으로 확인할 수
있습니다.

## 새 화면 추가하는 순서

1. `shared/config/navigation.ts` 의 `ROUTES` 에 주소 추가
2. `features/<영역>/XxxPage.tsx` 작성
3. `app/router.tsx` 에서 `PlaceholderPage` 를 실제 화면으로 교체
   — 탭이 보여야 하면 `MainLayout` 그룹, 뒤로가기면 `StackLayout` 그룹
