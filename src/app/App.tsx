import { StatusBadge } from '@/shared/ui/StatusBadge';
import {
  APPLICATION_STATUS,
  DEMO_REQUIRED_STATUSES,
  OFFER_STATUS,
  RENTAL_STATUS,
  TRADE_STATUS,
  type ApplicationStatus,
  type OfferStatus,
  type RentalStatus,
  type TradeStatus,
} from '@/shared/config/status';
import {
  CARBON_SECTOR_LABEL,
  CATEGORIES,
  TRADE_TYPE_FILTERS,
  TRADE_TYPE_LABEL,
} from '@/shared/config/categories';
import {
  DESKTOP_SIDEBAR_ITEMS,
  MOBILE_TAB_ITEMS,
} from '@/shared/config/navigation';
import {
  CARBON_DISCLAIMER,
  CARBON_FORMULA,
  SECTOR_FACTORS,
  calculateAvoidedCarbon,
  formatCarbon,
} from '@/shared/lib/carbon';

/**
 * 셋업 확인 화면 (임시)
 *
 * 라우터와 실제 화면이 붙기 전 단계라, 지금까지 확정한 규격이
 * 제대로 동작하는지 눈으로 확인하기 위한 페이지다.
 * router.tsx 가 들어오면 이 파일은 통째로 교체된다.
 */

const BRAND_SWATCH = [
  ['50', 'bg-brand-50'],
  ['100', 'bg-brand-100'],
  ['200', 'bg-brand-200'],
  ['300', 'bg-brand-300'],
  ['400', 'bg-brand-400'],
  ['500', 'bg-brand-500'],
  ['600', 'bg-brand-600'],
  ['700', 'bg-brand-700'],
  ['800', 'bg-brand-800'],
  ['900', 'bg-brand-900'],
] as const;

const TRADE_STATUSES = Object.values(TRADE_STATUS) as TradeStatus[];
const APPLICATION_STATUSES = Object.values(
  APPLICATION_STATUS,
) as ApplicationStatus[];
const RENTAL_STATUSES = Object.values(RENTAL_STATUS) as RentalStatus[];
const OFFER_STATUSES = Object.values(OFFER_STATUS) as OfferStatus[];

/** '미래 날짜 예약 중' 라벨을 확인하기 위한 미래 일자 */
const FUTURE_DATE = new Date(Date.now() + 14 * 86_400_000)
  .toISOString()
  .slice(0, 10);

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-ink-200 p-5">
      <h2 className="text-base font-bold">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-500">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 py-2.5 last:border-0">
      <span className="w-24 shrink-0 text-xs font-medium text-ink-500">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <header className="mb-8">
        <p className="text-sm font-semibold text-brand-600">
          Looper · 캠퍼스 순환거래 플랫폼
        </p>
        <h1 className="mt-1 text-2xl font-bold">프로젝트 셋업 확인</h1>
        <p className="mt-2 text-sm text-ink-500">
          BE API 명세와 Figma 와이어프레임을 반영한 규격이 정상 동작하는지
          확인하는 임시 화면입니다. 라우터가 붙으면 교체됩니다.
        </p>
      </header>

      <div className="grid gap-5">
        <Section
          title="브랜드 컬러"
          note="Figma 와이어프레임이 흑백 저해상도라 색 값은 기획서 목업 기준 잠정값입니다. 확정되면 src/index.css 의 @theme 블록만 교체하면 됩니다."
        >
          <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
            {BRAND_SWATCH.map(([step, cls]) => (
              <div key={step}>
                <div
                  className={`h-12 rounded-btn border border-ink-200 ${cls}`}
                />
                <p className="mt-1 text-center text-xs text-ink-500">{step}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="상태 뱃지 — 4개 상태군"
          note="BE 명세 기준입니다. 거래 게시물·거래 신청·대여 요청·대여 지원이 각각 별도 상태를 가집니다."
        >
          <Row label="거래 게시물">
            {TRADE_STATUSES.map((s) => (
              <StatusBadge key={s} kind="trade" status={s} />
            ))}
            <StatusBadge
              kind="trade"
              status={TRADE_STATUS.RESERVED}
              availableDate={FUTURE_DATE}
            />
          </Row>
          <Row label="거래 신청">
            {APPLICATION_STATUSES.map((s) => (
              <StatusBadge key={s} kind="application" status={s} />
            ))}
          </Row>
          <Row label="대여 요청">
            {RENTAL_STATUSES.map((s) => (
              <StatusBadge key={s} kind="rental" status={s} />
            ))}
          </Row>
          <Row label="대여 지원">
            {OFFER_STATUSES.map((s) => (
              <StatusBadge key={s} kind="offer" status={s} />
            ))}
          </Row>
          <Row label="반납 지연">
            <StatusBadge
              kind="rental"
              status={RENTAL_STATUS.IN_USE}
              isOverdue
            />
            <span className="text-xs text-ink-400">
              is_overdue 는 status 와 독립된 플래그라 겹쳐서 표시합니다
            </span>
          </Row>
        </Section>

        <Section
          title="시연용 9개 상태 커버리지"
          note="기획서 R2 대응. 시드 데이터가 이 9개를 모두 만들어내야 목록이 비어 보이지 않습니다."
        >
          <ul className="grid gap-1.5 text-sm md:grid-cols-2">
            {DEMO_REQUIRED_STATUSES.map((s) => (
              <li key={s.label} className="flex items-baseline gap-2">
                <span className="font-medium">{s.label}</span>
                <span className="text-xs text-ink-400">{s.source}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="내비게이션 구조"
          note="Figma 기준. 모바일 하단 탭과 데스크톱 사이드바가 다릅니다."
        >
          <Row label="모바일 탭">
            {MOBILE_TAB_ITEMS.map((i) => (
              <span
                key={i.key}
                className="rounded-chip bg-ink-50 px-3 py-1.5 text-xs text-ink-600"
              >
                {i.mobileLabel}
              </span>
            ))}
          </Row>
          <Row label="데스크톱">
            {DESKTOP_SIDEBAR_ITEMS.map((i) => (
              <span
                key={i.key}
                className="rounded-chip bg-ink-50 px-3 py-1.5 text-xs text-ink-600"
              >
                {i.desktopLabel}
              </span>
            ))}
          </Row>
        </Section>

        <Section
          title="거래 유형 · 카테고리"
          note="거래 유형은 명세 확정값입니다. 카테고리는 명세에 HOME_LIVING·ELECTRONICS 두 개만 등장해 나머지는 잠정값입니다 — BE Enum 전체 목록 확인 필요."
        >
          <Row label="거래 유형">
            {TRADE_TYPE_FILTERS.map((t) => (
              <span
                key={t}
                className="rounded-chip bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700"
              >
                {TRADE_TYPE_LABEL[t]}
                <span className="ml-1.5 font-normal text-brand-600/70">
                  {t}
                </span>
              </span>
            ))}
          </Row>
          <Row label="카테고리">
            {CATEGORIES.map((c) => (
              <span
                key={c.code}
                className="rounded-chip bg-ink-50 px-3 py-1.5 text-xs text-ink-600"
              >
                {c.label}
              </span>
            ))}
          </Row>
        </Section>

        <Section title="탄소 절감량 계산" note={CARBON_FORMULA}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-md text-left text-sm">
              <thead className="text-xs text-ink-500">
                <tr className="border-b border-ink-200">
                  <th className="py-2 font-medium">섹터</th>
                  <th className="py-2 font-medium">회피계수</th>
                  <th className="py-2 font-medium">생산단계 비중</th>
                  <th className="py-2 font-medium">5kg 기준 절감량</th>
                </tr>
              </thead>
              <tbody>
                {(
                  Object.keys(SECTOR_FACTORS) as Array<
                    keyof typeof SECTOR_FACTORS
                  >
                ).map((sector) => (
                  <tr key={sector} className="border-b border-ink-100">
                    <td className="py-2.5">{CARBON_SECTOR_LABEL[sector]}</td>
                    <td className="py-2.5 tabular-nums">
                      {SECTOR_FACTORS[sector].avoidanceFactor}
                    </td>
                    <td className="py-2.5 tabular-nums">
                      {(SECTOR_FACTORS[sector].productionShare * 100).toFixed(
                        1,
                      )}
                      %
                    </td>
                    <td className="py-2.5 font-semibold tabular-nums text-brand-700">
                      {formatCarbon(calculateAvoidedCarbon(5, sector))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-400">{CARBON_DISCLAIMER}</p>
        </Section>
      </div>
    </div>
  );
}
