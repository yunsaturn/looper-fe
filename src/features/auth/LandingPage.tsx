import { Link } from 'react-router-dom';

import { ROUTES } from '@/shared/config/navigation';

/**
 * 서비스 소개 화면 (로그인 전).
 *
 * Figma 의 첫 화면을 그대로 옮겼다. 무엇을 하는 서비스인지, 왜 안전한지를
 * 로그인 전에 알려주고 가입으로 보낸다.
 *
 * ⚠️ Figma 에는 "우리가 만든 변화"(절약 금액·폐기물·탄소) 통계 카드가
 *    있지만 넣지 않았다. 서버의 임팩트 API 는 전부 인증이 필요해서
 *    로그인 전에는 받을 수 있는 수치가 없다. 예시 숫자를 박아 넣으면
 *    실제 성과처럼 읽히므로(기획서 R3) 공개 집계 API 가 생기면 그때
 *    ServiceImpactStats 를 채우기로 하고 자리만 비워 뒀다.
 */
export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col px-5 py-10">
      <div className="mx-auto flex w-full max-w-sm grow flex-col">
        <header className="pt-6 pb-8 text-center">
          <img
            src="/logo.png"
            alt="루퍼"
            className="mx-auto h-12 w-auto"
            width={180}
            height={48}
          />
          <p className="mt-5 text-sm text-ink-600">
            캠퍼스에서 필요한 물건을 편리하게 나누고 받으세요
          </p>
        </header>

        <div className="grid gap-2.5">
          <FeatureCard
            icon={<ExchangeIcon />}
            title="판매 · 나눔 · 구합니다"
            description="캠퍼스 픽업존에서 간편하게 거래"
          />
          <FeatureCard
            icon={<BoxIcon />}
            title="대여 요청"
            description="필요한 물건을 빌리고 빌려줘요"
          />
        </div>

        <h2 className="mt-8 mb-3 text-base font-bold text-ink-900">
          안전한 캠퍼스 거래
        </h2>
        <div className="grid gap-2.5">
          <FeatureCard
            icon={<MailIcon />}
            title="학교 이메일 인증"
            description="재학생만 이용할 수 있어요"
          />
          <FeatureCard
            icon={<CheckIcon />}
            title="거래·대여 상태 확인"
            description="신청·예약·완료까지 단계별로 안내해요"
          />
        </div>

        <div className="mt-auto pt-10">
          <Link
            to={ROUTES.SIGNUP}
            className="flex h-12 w-full items-center justify-center rounded-btn bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            학교 이메일로 시작하기
          </Link>
          <p className="mt-4 text-center text-sm text-ink-500">
            <Link to={ROUTES.LOGIN} className="underline hover:text-ink-700">
              이미 계정이 있어요 — 로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-gray-50 px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-white text-brand-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink-900">{title}</p>
        <p className="mt-0.5 text-xs text-ink-500">{description}</p>
      </div>
    </div>
  );
}

/* ─────────────────── 아이콘 ─────────────────── */

const ICON = 'h-5 w-5';

function ExchangeIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" aria-hidden="true">
      <path
        d="M4 8h13l-3-3M20 16H7l3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" aria-hidden="true">
      <path
        d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z M3 8.5 12 13m0 0 9-4.5M12 13v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="m8 12 3 3 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
