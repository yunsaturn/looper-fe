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
