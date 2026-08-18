# app/

앱을 **켜는** 코드만 모아 둔 곳입니다. "무엇을 보여줄까"는 여기서 정하고,
"어떻게 생겼나"와 "서버에서 뭘 받아오나"는 각각 `features/`, `entities/`
담당입니다. 그래서 이 폴더에는 도메인 로직이 없습니다.

```
app/
├─ App.tsx        Providers 로 AppRouter 를 감싸는 껍데기 (10줄)
├─ providers.tsx  앱 전체에 깔리는 것들을 한 번에 설치
├─ router.tsx     어떤 주소에 어떤 화면을 붙일지 선언
└─ layouts/
    ├─ MainLayout.tsx    하단 탭 / 좌측 사이드바가 있는 최상위 화면용
    └─ StackLayout.tsx   흐름 안으로 들어가는 화면용 (뒤로가기 헤더)
```

## 앱이 켜지는 순서

```
src/main.tsx
   └─ MSW 목업 워커 먼저 켜기          ← 이게 먼저여야 초기 요청이 목업을 탄다
        └─ App.tsx
             └─ providers.tsx  ─ QueryClientProvider
                                ─ BrowserRouter
                                ─ ToastProvider
                  └─ router.tsx  ─ 주소에 맞는 화면
```

## providers.tsx 가 정해 두는 것

- **쿼리 재시도** — 4xx 는 다시 보내도 결과가 같으니 재시도하지 않고,
  네트워크 오류만 한 번 더 시도합니다.
- **mutation 재시도 없음** — 실패한 요청을 자동으로 다시 보내면 중복 수락·
  이중 완료가 생길 수 있습니다. (기획서 R5)
- **401 처리** — 토큰이 만료되면 로그아웃시키고 로그인 화면으로 보냅니다.
  `shared/api/client.ts` 에 콜백을 주입하는 방식입니다. axios 파일이
  라우터를 직접 알 필요가 없게 하려고 이렇게 나눠 뒀습니다.

## router.tsx 규칙

**1. 라우트는 화면 구현 여부와 무관하게 전부 선언합니다**

아직 안 만든 화면도 `PlaceholderPage` 로 연결해 둡니다. 그래야 다른
화면에서 링크를 걸어도 깨지지 않고, 나중에 컴포넌트만 갈아 끼우면 됩니다.

**2. 주소 문자열을 직접 쓰지 않습니다**

```tsx
// ✗ <Route path="/trades/:tradeId" ... />
// ✓ <Route path={ROUTES.TRADE_DETAIL} ... />
```

모든 주소는 `shared/config/navigation.ts` 의 `ROUTES` 에서 옵니다.
`navigate()` 를 쓰는 화면 코드도 마찬가지입니다.

**3. 구체적인 경로를 먼저 씁니다**

`/trades/new` 가 `/trades/:tradeId` 보다 **위**에 있어야 합니다.
순서가 바뀌면 `new` 가 게시물 ID 로 잡힙니다.

**4. 로그인이 필요한 화면은 `RequireAuth` 안에 둡니다**

`MainLayout` · `StackLayout` 두 그룹이 통째로 감싸여 있어서, 새 화면을
그 안에 추가하면 인증 보호가 자동으로 따라옵니다.

## 두 레이아웃 고르는 법

| | MainLayout | StackLayout |
| --- | --- | --- |
| 언제 | 탭으로 오가는 최상위 화면 | 흐름 안으로 들어가는 화면 |
| 예 | 홈, 거래 목록, 대여 목록, 임팩트 | 상세, 등록, 신청자 목록, 완료 |
| 상단 | 없음 | 뒤로가기 + 제목 |
| 하단 | 모바일 탭바 (데스크톱은 좌측 사이드바) | 없음 |

## 예외 한 가지

`features/` 끼리는 서로 import 하지 않는 게 규칙인데, `router.tsx` 만
예외입니다. 라우터는 모든 features 를 가져옵니다.
