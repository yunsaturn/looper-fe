# Looper FE

캠퍼스 순환거래 플랫폼 **Looper** 프론트엔드입니다.

학교 이메일로 인증한 같은 캠퍼스 구성원끼리, 버릴 물건은 원하는 날짜에
넘기고 잠깐 필요한 물건은 시간 단위로 빌려 쓰게 연결하며, 그 결과를
예상 탄소 절감량으로 보여줍니다.

> 2026 EST AI Challengers Online Hackathon · TEAM 37.5°C

## 시작하기

```bash
npm install
cp .env.example .env   # 기본값이 목업 모드라 BE 없이 바로 뜹니다
npm run dev            # http://localhost:5173
```

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 검사 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run typecheck` | 타입 검사만 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier 일괄 포맷 |
| `npm run gen:api` | Swagger JSON → TS 타입 생성 (`docs/api-spec.json` 필요) |

## 기술 스택

- **Vite + React 18 + TypeScript**
- **Tailwind CSS v4** — 유틸리티 CSS
- **React Router v7** — 라우팅
- **TanStack Query v5** — 서버 상태 단일 출처
- **axios** — API 클라이언트
- **zustand** — 인증 토큰 등 최소 클라이언트 상태
- **MSW** — 목업 서버 (BE 없이 개발 + 시연 폴백)

`@/` 는 `src/` 를 가리킵니다. (`vite.config.ts`, `tsconfig.json` 양쪽에 설정)

## 폴더 구조

한 줄로 요약하면 이렇습니다.

> **화면은 서버를 직접 모릅니다.** 화면이 서버와 이야기하고 싶으면
> 반드시 `entities/` 를 거칩니다.

```
features/*  →  entities/*/api.ts  →  shared/api/client.ts  →  (MSW | Spring Boot)
   화면            주소·타입             axios 인스턴스           실제 응답
```

이렇게 나눠 두면 BE 명세가 바뀌어도 `entities/` 만 고치면 되고, 화면
코드는 건드릴 일이 없습니다.

### 전체 지도

```
src/
├─ main.tsx        브라우저 진입점. 목업 워커를 먼저 켜고 React 를 띄운다
├─ index.css       디자인 토큰 (색·글자 크기·모서리) — 이 프로젝트의 유일한 색 출처
│
├─ app/            앱을 "켜는" 코드. 도메인 로직은 없다
│   ├─ App.tsx        Providers + AppRouter 를 감싸는 껍데기
│   ├─ providers.tsx  QueryClient · Router · Toast · 401 처리 주입
│   ├─ router.tsx     전체 라우트 선언 (미구현 화면은 Placeholder 로 연결)
│   └─ layouts/       MainLayout(탭 있는 화면) · StackLayout(뒤로가기 헤더)
│
├─ shared/         어느 기능에서나 쓰는 공통 자산. 도메인 지식이 없다
│   ├─ api/           axios 인스턴스 · 오류 타입 · 쿼리 키
│   ├─ config/        상태 · 라우트 · 카테고리 상수  ← "단일 출처" 파일들
│   ├─ lib/           날짜/가격 포맷, 탄소 계산, className 유틸
│   ├─ store/         zustand 인증 스토어 (서버 데이터는 넣지 않는다)
│   └─ ui/            Button · Field · Sheet · Toast 등 공통 컴포넌트
│
├─ entities/       서버와 주고받는 타입 + 호출 함수  ← BE 연동 시 여기만 수정
│   ├─ user/  trade/  rental/  impact/     핵심 도메인 (types.ts + api.ts)
│   ├─ ai/                                  이미지 → 제목·카테고리·설명 초안
│   ├─ meta/                                학교 · 캠퍼스 · 픽업존 목록
│   └─ storage/                             이미지 업로드 (presigned URL)
│
├─ features/       실제 화면. 폴더 하나 = 기능 영역 하나
│   ├─ auth/    로그인
│   ├─ home/    홈 피드
│   ├─ trade/   거래 (목록 · 상세 · 등록 · 신청자 · 완료 · AI 입력 도우미)
│   ├─ rent/    대여 (목록 · 상세 · 등록 · 지원자 · 완료)
│   ├─ impact/  탄소 절감 대시보드 · 계산식 설명
│   └─ misc/    아직 안 만든 화면을 대신 보여주는 PlaceholderPage
│
└─ mocks/         MSW 목업 서버
    ├─ browser.ts   워커 기동 (VITE_USE_MOCK=true 일 때만)
    ├─ handlers.ts  요청 핸들러
    └─ seed.ts      시드 데이터
```

각 폴더의 자세한 규칙은 그 폴더의 `README.md` 에 있습니다.
[app](src/app/README.md) · [shared](src/shared/README.md) ·
[entities](src/entities/README.md) · [features](src/features/README.md) ·
[mocks](src/mocks/README.md)

### 처음 보는 사람이 읽는 순서

1. `src/main.tsx` — 앱이 어떻게 시작되는지
2. `src/app/router.tsx` — 어떤 화면들이 있는지
3. `src/features/trade/TradeListPage.tsx` — 화면 하나가 어떻게 생겼는지
4. `src/entities/trade/api.ts` — 그 화면이 서버를 어떻게 부르는지
5. `src/mocks/handlers.ts` — 그 호출에 지금 누가 답하고 있는지

## 설계 원칙

**1. 상태는 서버가 단일 출처입니다**

거래·대여의 상태 전이 규칙(활성 신청 1건 제한, 완료 1회 반영, 양측 확인)은
서버가 강제합니다. 프론트는 서버 응답 상태를 그대로 렌더링하며, 낙관적
업데이트를 사용하지 않습니다. mutation 성공 후에는 `invalidateQueries` 로
다시 조회합니다.

상태 코드·라벨·색상은 전부 `src/shared/config/status.ts` 한 곳에서 옵니다.

**2. AI 서비스는 직접 호출하지 않습니다**

AI(FastAPI)는 Private API 이며 Spring Boot 만 접근할 수 있습니다.
프론트는 `VITE_API_BASE_URL` 로만 통신합니다. (`entities/ai/api.ts` 도
Spring Boot 의 `/api/v1/ai/...` 를 부릅니다)

**3. 탄소 수치는 항상 각주와 함께 표기합니다**

모든 탄소 수치는 실측값이 아닌 **예상 절감량**입니다. 실측값(절약 금액,
줄인 폐기물 kg)을 위에 두고, 추정값(kgCO₂e)은 `"대체율 0.65 가정"` 각주와
함께 아래에 배치합니다. 계수와 계산식은 `src/shared/lib/carbon.ts` 에
출처와 함께 정의되어 있습니다.

**4. 개인정보는 최소한만 다룹니다**

주민등록번호·전화번호·주소는 수집하지 않습니다. 공개 정보는 닉네임, 학교,
캠퍼스, 신뢰도로 한정합니다. API 키와 비밀값은 `.env` 로 분리하며 커밋하지
않습니다.

## BE 연동

프론트는 Spring Boot REST API 하나만 바라봅니다.
`.env` 의 `VITE_USE_MOCK` 으로 목업/실서버를 전환합니다.

| 값 | 동작 |
| --- | --- |
| `VITE_USE_MOCK=true` | MSW 목업 서버. BE 없이 전체 화면이 동작합니다 |
| `VITE_USE_MOCK=false` | `VITE_API_BASE_URL` 의 실제 서버로 나갑니다 |

연동 절차는 [`src/entities/README.md`](src/entities/README.md) 를 참고하세요.

BE 는 Jackson SNAKE_CASE 이므로 요청·응답 필드가 모두 snake_case 이고,
프론트 타입도 변환 없이 snake_case 를 그대로 씁니다.

## 진행 상황

- [x] 프로젝트 스캐폴딩 (Vite · TS · Tailwind v4 · ESLint · Prettier)
- [x] 디자인 토큰 (`src/index.css`) — Figma 값 도착 시 교체 예정
- [x] 거래·대여 상태 규격 (`src/shared/config/status.ts`)
- [x] 카테고리 · 픽업존 · 탄소 계수 상수
- [x] 공통 UI 컴포넌트 (`src/shared/ui/`)
- [x] API 클라이언트 + entities 레이어
- [x] MSW 목업 + 시드 데이터 (데모 필수 9개 상태 포함)
- [x] 라우터 + 핵심 화면 (로그인 · 홈 · 거래 · 대여 · 임팩트)
- [ ] 남은 화면 — 회원가입(학교 이메일 인증), 마이프로필, 게시물/요청 수정,
      사용자 프로필, 나의 거래 목록, 캠퍼스 대시보드
- [ ] 관리자 화면 (BE 에 API 가 없어 목업으로만, 우선순위 P3)
- [ ] 실제 Spring Boot 서버 연동 (`VITE_USE_MOCK=false` 전체 재검증)

미구현 화면도 라우트는 전부 선언돼 있고 `PlaceholderPage` 로 연결됩니다.
그래서 링크를 눌러도 깨지지 않습니다.
