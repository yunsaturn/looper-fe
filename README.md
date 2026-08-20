# 루퍼(Looper) — 개인 포트폴리오 사본

> **2026 EST AI Challengers 해커톤**에서 진행한 5인 팀 프로젝트 **루퍼**(캠퍼스
> 순환장터)의 프론트엔드 저장소를, 제 포트폴리오용으로 옮긴 개인 사본입니다.
> 정본은 아래 팀 원본 저장소이며 이 사본은 제가 담당한 범위를 정리하기 위한
> 것입니다. `Looper FE` 이하 본문은 팀 저장소 README 원문 그대로입니다.

| 항목      | 내용                                          |
| --------- | --------------------------------------------- |
| 대회      | 2026 EST AI Challengers 해커톤                |
| 성과      | 38개 팀 중 **우수상**                         |
| 팀        | Team 37.5°C · 5인                             |
| 개발 기간 | 2026-08-16 ~ 2026-08-19 (커밋 기록 기준)      |
| 담당      | 프론트엔드 전체 및 백엔드 API 연동            |
| 배포      | <https://fe-vlak.vercel.app>                  |

## 팀 원본 저장소

| 파트     | 저장소                                               |
| -------- | ---------------------------------------------------- |
| Frontend | <https://github.com/EST-AI-Challengers-37-Looper/FE> |
| Backend  | <https://github.com/EST-AI-Challengers-37-Looper/BE> |
| AI       | <https://github.com/EST-AI-Challengers-37-Looper/AI> |

## 전체 아키텍처

루퍼는 React 프론트엔드, Spring Boot 백엔드, FastAPI AI 서비스 세 갈래로
구성됩니다. 브라우저에서 도는 React SPA는 Spring Boot REST API(`/api/v1`)
한 곳하고만 통신하며, 인증은 Access/Refresh Token을 `Authorization` 헤더에
실어 보냅니다. 상품 사진으로 상품명·카테고리를 추천하는 AI 기능은 FastAPI
서비스가 담당하는데, 이 서비스는 Private이라 프론트에서 직접 호출하지 않고
Spring Boot가 중계합니다. 따라서 프론트 입장에서는 AI 응답도 백엔드 API의
일부입니다. 백엔드 없이도 화면을 시연할 수 있도록 프론트에는 MSW 목업 계층을
따로 두고 `VITE_USE_MOCK`으로 전환합니다.

## 담당 범위

프론트엔드 전체와 백엔드 API 연동을 맡았습니다. git 기록 기준으로는 다음과
같습니다.

- 전체 82개 커밋 중 **75개**가 제 커밋입니다.
- 현재 `src/` 아래 112개 파일 중 **103개**를 제가 최초 작성했습니다.
- 나머지 9개 파일은 팀원이 구현한 대여 안전 확인(사진 대조) 흐름입니다.
  (`src/features/rent/safety/`, `src/entities/rental/safety/`)

구체적으로 담당한 작업입니다.

- **라우팅·레이아웃 설계** — 모바일 하단 탭과 데스크톱 사이드바로 갈리는
  반응형 내비게이션, 라우트 단위 코드 스플리팅, 인증 가드
- **API 클라이언트** — 토큰 첨부, 여러 요청이 동시에 401을 받아도 Refresh
  요청은 한 번만 보내는 자동 갱신, 공통 오류 처리, `baseURL` 정규화
- **백엔드 연동 계층** — 도메인별 DTO 타입과 API 호출 함수(`src/entities/`).
  서버가 snake_case라 변환 계층 없이 명세를 그대로 반영
- **서버 상태 관리** — TanStack Query로 조회하고 변경 성공 후 관련 쿼리를
  무효화합니다. 중복 수락·이중 완료를 막기 위해 mutation 자동 재시도와
  낙관적 업데이트는 쓰지 않았습니다
- **MSW 목업 서버와 시드 데이터** — 백엔드 없이 전체 화면이 돌아갑니다
- **테스트** — API 계약 테스트, 픽업존·포맷 유틸 단위 테스트 (Vitest)
- **배포·운영 대응** — Vercel 배포 설정, Render 무료 플랜 콜드 스타트 대응
  (기동용 헬스체크 선요청 + 타임아웃 상향)

## 구현한 화면

| 영역   | 화면                    | 경로                             |
| ------ | ----------------------- | -------------------------------- |
| 인증   | 랜딩                    | `/landing`                       |
| 인증   | 로그인                  | `/login`                         |
| 인증   | 학교 이메일 회원가입    | `/signup`                        |
| 인증   | 비밀번호 재설정         | `/password/reset`                |
| 메인   | 홈 피드                 | `/`                              |
| 메인   | 통합 검색               | `/search`                        |
| 거래   | 목록                    | `/trades`                        |
| 거래   | 등록 (사진·AI 입력 보조) | `/trades/new`                    |
| 거래   | 상세                    | `/trades/:tradeId`               |
| 거래   | 수정                    | `/trades/:tradeId/edit`          |
| 거래   | 신청자 목록·선택        | `/trades/:tradeId/applicants`    |
| 거래   | 거래 완료               | `/trades/:tradeId/complete`      |
| 대여   | 목록                    | `/rentals`                       |
| 대여   | 등록                    | `/rentals/new`                   |
| 대여   | 상세                    | `/rentals/:rentalId`             |
| 대여   | 수정                    | `/rentals/:rentalId/edit`        |
| 대여   | 지원자 목록             | `/rentals/:rentalId/offers`      |
| 대여   | 반납·완료               | `/rentals/:rentalId/complete`    |
| 임팩트 | 개인·캠퍼스 대시보드    | `/impact`                        |
| 임팩트 | 산정 방식·계수 출처     | `/impact/method`                 |
| 임팩트 | 활동 상세               | `/impact/activities/:activityId` |
| 프로필 | 내 프로필               | `/me`                            |
| 프로필 | 내 활동                 | `/me/activities`                 |
| 프로필 | 상대방 공개 프로필      | `/users/:userId`                 |
| 알림   | 알림 목록               | `/notifications`                 |

대여 상세 안에서 이어지는 안전 확인(사진 대조) 흐름은 팀원이 구현했습니다.
관리자 화면(`/admin/login`, `/admin/status`)과 캠퍼스 대시보드
(`/impact/campus`)는 대응하는 백엔드 API가 없어 자리만 잡아둔 상태입니다.

## 기술 스택

| 구분        | 사용 기술                                                     |
| ----------- | ------------------------------------------------------------- |
| 언어·빌드   | TypeScript 5 (strict), Vite 6                                  |
| UI          | React 18, React Router 7, Tailwind CSS 4                       |
| 서버 상태   | TanStack Query 5, Axios 1                                      |
| 클라이언트 상태 | Zustand 5 (인증 상태)                                      |
| 목업        | MSW 2                                                          |
| 테스트      | Vitest 4                                                       |
| 코드 품질   | ESLint 9, Prettier 3, `tsc --noEmit`                           |
| 타입 생성   | openapi-typescript (백엔드 OpenAPI 스펙 → 타입)                |
| 지도        | Kakao Maps JavaScript SDK (픽업존 마커 선택, 런타임 로드)      |
| 배포        | Vercel                                                         |

---

# Looper FE

> 같은 캠퍼스 안에서 물건을 사고, 나누고, 빌리며 자원 순환 효과를 확인하는
> 웹 서비스

[배포된 서비스 바로가기](https://fe-vlak.vercel.app)

Looper는 학교 이메일로 인증된 구성원을 연결합니다. 사용하지 않는 물건은
거래·나눔하고, 잠깐 필요한 물건은 시간 단위로 빌릴 수 있습니다. 완료된
활동은 절약 금액, 줄인 폐기물, 예상 탄소 절감량으로 보여줍니다.

2026 EST AI Challengers Online Hackathon · Team 37.5°C

## 무엇을 할 수 있나요?

| 기능              | 설명                                                        |
| ----------------- | ----------------------------------------------------------- |
| 캠퍼스 인증       | 학교 이메일 인증 후 같은 캠퍼스 사용자끼리 이용합니다.      |
| 거래·나눔         | 판매, 나눔, 구합니다 게시물을 등록하고 신청자를 선택합니다. |
| 사진·AI 입력 보조 | 사진을 최대 5장 올리고 상품명·카테고리 추천을 받습니다.     |
| 시간 단위 대여    | 시작 시간과 사용 시간을 정해 물건을 빌리거나 빌려줍니다.    |
| 안전한 상태 전이  | 예약, 취소, 완료를 서버 상태에 맞춰 처리합니다.             |
| 순환 임팩트       | 개인·캠퍼스의 절약 금액과 예상 탄소 절감량을 확인합니다.    |
| 프로필·활동       | 신뢰도, 완료 횟수, 내가 등록·신청한 활동을 확인합니다.      |

탄소 수치는 실측값이 아닌 **예상 절감량**입니다. 화면에는 적용한 가정과
계수 출처를 함께 표시합니다.

## 3분 만에 실행하기

### 준비물

- Node.js 22 권장
- npm 10 이상

### 1. 설치

```bash
git clone https://github.com/EST-AI-Challengers-37-Looper/FE.git
cd FE
npm ci
cp .env.example .env
```

### 2. 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다.

기본 환경변수는 목업 모드이므로 BE 없이도 주요 화면을 확인할 수 있습니다.
목업 로그인은 `demo@xx.ac.kr`과 비어 있지 않은 비밀번호를 사용하면 됩니다.

### GitHub Codespaces

```bash
npm run dev
```

VS Code의 **Ports** 탭에서 5173 포트의 `Open in Browser`를 누릅니다. 다른
사람에게 공유할 때만 포트 공개 범위를 `Public`으로 바꾸세요. 개발 서버는
5173 포트를 고정해서 사용하므로 이미 사용 중이면 다른 포트로 자동 변경하지
않고 오류를 알려줍니다.

## 실제 BE에 연결하기

`.env`를 다음처럼 바꿉니다.

```dotenv
VITE_API_BASE_URL=https://be-andh.onrender.com
VITE_USE_MOCK=false
```

그다음 개발 서버를 다시 시작합니다.

```bash
npm run dev
```

`VITE_` 환경변수는 빌드 시점에 포함됩니다. Vercel에서 값을 바꿨다면 반드시
재배포해야 합니다.

### CORS 확인

FE와 BE 도메인이 다르므로 BE는 다음을 허용해야 합니다.

- Origin: 배포된 FE 주소
- Methods: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`
- Headers: `Authorization`, `Content-Type`

브라우저에서 실제 요청보다 먼저 전송되는 `OPTIONS`가 403이면 FE 요청 로직이
아니라 BE의 CORS 설정과 배포 상태를 먼저 확인하세요.

## 자주 쓰는 명령어

| 명령어              | 용도                                 |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Vite 개발 서버 실행                  |
| `npm test`          | Vitest 단위·계약 테스트 실행         |
| `npm run lint`      | ESLint 정적 검사                     |
| `npm run typecheck` | TypeScript 타입 검사                 |
| `npm run format`    | 소스 코드 자동 정렬                  |
| `npm run build`     | 타입 검사 후 프로덕션 빌드           |
| `npm run validate`  | 포맷·린트·테스트·빌드를 한 번에 검증 |
| `npm run preview`   | 빌드 결과를 로컬에서 확인            |

PR을 올리기 전에는 아래 한 줄을 실행하면 됩니다.

```bash
npm run validate
```

같은 검증은 GitHub Actions에서도 PR과 `main` 푸시마다 자동 실행됩니다.

## 프로젝트 구조

```text
src/
├── app/       앱 시작, Provider, Router, Layout
├── features/  사용자가 보는 기능별 화면
├── entities/  BE DTO 타입과 API 호출 함수
├── shared/    공통 설정, API 클라이언트, 상태, UI, 유틸
└── mocks/     BE 없이 실행하기 위한 MSW 핸들러와 시드
```

데이터 흐름은 한 방향입니다.

```text
화면(features)
  → 도메인 API(entities)
  → 공통 Axios 클라이언트(shared/api)
  → MSW 목업 또는 Spring Boot API
```

화면에서 `axios`를 직접 호출하지 않습니다. API 경로와 DTO는 `entities/`에,
토큰 첨부·갱신과 공통 오류 처리는 `shared/api/client.ts`에 모아둡니다.

더 자세한 규칙:

- [앱과 라우팅](src/app/README.md)
- [API와 DTO](src/entities/README.md)
- [기능 화면](src/features/README.md)
- [공통 코드](src/shared/README.md)
- [목업 서버](src/mocks/README.md)

## 핵심 설계

### 서버 상태가 기준입니다

거래·대여 상태는 TanStack Query로 조회하고, 변경 성공 후 관련 쿼리를 다시
불러옵니다. 중복 수락이나 이중 완료를 막기 위해 mutation 자동 재시도와
낙관적 업데이트는 사용하지 않습니다.

### 인증 실패는 한 번만 갱신합니다

여러 요청이 동시에 401을 받아도 Refresh Token 요청은 하나만 전송합니다.
갱신에 실패하면 토큰과 사용자별 캐시를 정리한 뒤 로그인 화면으로 이동합니다.

### AI 장애가 등록을 막지 않습니다

AI는 입력 보조 기능입니다. 분석 실패나 낮은 신뢰도 응답이 와도 사용자가
상품명·카테고리·설명을 직접 입력해 게시물을 등록할 수 있습니다.

### 코드 분할과 목업 분리

상세·등록·프로필·임팩트 화면은 라우트 단위로 나눠 내려받습니다. MSW와 목업
데이터도 동적 import하므로 실제 서버 모드에서는 목업 번들을 받지 않습니다.

## 환경변수

| 이름                | 기본값                  | 설명                                      |
| ------------------- | ----------------------- | ----------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Spring Boot API 주소                      |
| `VITE_USE_MOCK`     | `true`                  | `true`면 MSW 목업, `false`면 실제 BE 사용 |

API 키와 비밀값은 프론트 환경변수에 넣으면 안 됩니다. `VITE_` 값은 브라우저에
공개되므로 주소와 공개 설정만 사용하세요.

## 배포

Vercel은 `vercel.json`을 사용합니다.

- SPA 경로를 `index.html`로 연결
- 해시가 붙은 정적 자산을 장기 캐시
- 목업 서비스워커 파일은 캐시하지 않음

배포 환경에서는 다음 값을 권장합니다.

```dotenv
VITE_API_BASE_URL=https://be-andh.onrender.com
VITE_USE_MOCK=false
```

## 현재 구현 상태

완료:

- 로그인, 이메일 인증 회원가입, 비밀번호 재설정, 로그아웃·탈퇴
- 거래 목록·상세·등록·수정·삭제·신청·예약·완료
- 사진 최대 5장 업로드와 AI 입력 보조
- 대여 목록·상세·등록·수정·지원·수령·반납·완료
- 홈 피드, 검색, 내 프로필, 공개 프로필, 내 활동
- 개인·캠퍼스 임팩트와 순환 랭킹
- 반응형 레이아웃, MSW 목업, Vercel·Codespaces 설정

남은 범위:

- 관리자 기능: BE API가 추가된 뒤 구현

## 검증 기준

현재 저장소는 다음 항목을 통과해야 병합 가능한 상태로 봅니다.

1. Prettier 소스 포맷 검사
2. ESLint 정적 검사
3. TypeScript strict 타입 검사
4. Vitest 단위·API 계약 테스트
5. Vite 프로덕션 빌드

```bash
npm run validate
```

## 라이선스

[Apache License 2.0](LICENSE)
