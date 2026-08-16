# Looper FE

캠퍼스 순환거래 플랫폼 **Looper** 프론트엔드입니다.

학교 이메일로 인증한 같은 캠퍼스 구성원끼리, 버릴 물건은 원하는 날짜에
넘기고 잠깐 필요한 물건은 시간 단위로 빌려 쓰게 연결하며, 그 결과를
예상 탄소 절감량으로 보여줍니다.

> 2026 EST AI Challengers Online Hackathon · TEAM 37.5°C

## 시작하기

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 검사 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run typecheck` | 타입 검사만 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier 일괄 포맷 |
| `npm run gen:api` | Swagger JSON → TS 타입 생성 |

## 기술 스택

- **Vite + React 18 + TypeScript**
- **Tailwind CSS v4** — 유틸리티 CSS
- **React Router v7** — 라우팅
- **TanStack Query v5** — 서버 상태 단일 출처
- **axios** — API 클라이언트
- **zustand** — 인증 토큰 등 최소 클라이언트 상태
- **MSW** — 목업 서버 (BE 없이 개발 + 시연 폴백)

## 폴더 구조

```
src/
├─ app/         진입점 · 라우터 · 레이아웃
├─ shared/      공통 UI · API 클라이언트 · 설정 상수 · 유틸
├─ entities/    도메인 타입 + 엔드포인트 함수  ← BE 연동 시 여기만 수정
├─ features/    화면 (auth / trade / rent / impact)
└─ mocks/       MSW 핸들러 + 시드 데이터
```

각 폴더의 규칙은 해당 폴더의 `README.md` 를 참고하세요.

## 설계 원칙

**1. 상태는 서버가 단일 출처입니다**

거래·대여의 상태 전이 규칙(활성 신청 1건 제한, 완료 1회 반영, 양측 확인)은
서버가 강제합니다. 프론트는 서버 응답 상태를 그대로 렌더링하며, 낙관적
업데이트를 사용하지 않습니다. mutation 성공 후에는 `invalidateQueries` 로
다시 조회합니다.

상태 코드·라벨·색상은 전부 `src/shared/config/status.ts` 한 곳에서 옵니다.

**2. AI 서비스는 직접 호출하지 않습니다**

AI(FastAPI)는 Private API 이며 Spring Boot 만 접근할 수 있습니다.
프론트는 `VITE_API_BASE_URL` 로만 통신합니다.

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

```
features/*  →  entities/*/api.ts  →  shared/api/client.ts  →  (MSW | Spring Boot)
```

`.env` 의 `VITE_USE_MOCK` 으로 목업/실서버를 전환합니다. 연동 절차는
`src/entities/README.md` 를 참고하세요.

## 진행 상황

- [x] 프로젝트 스캐폴딩 (Vite · TS · Tailwind v4 · ESLint · Prettier)
- [x] 디자인 토큰 (`src/index.css`) — Figma 값 도착 시 교체 예정
- [x] 거래·대여 상태 규격 (`src/shared/config/status.ts`)
- [x] 카테고리 · 픽업존 · 탄소 계수 상수
- [ ] 공통 UI 컴포넌트
- [ ] API 클라이언트 + entities 레이어
- [ ] MSW 목업 + 시드 데이터
- [ ] 라우터 + 화면 구현
