import { StatusBadge } from '@/shared/ui/StatusBadge';
import {
  RENTAL_STATUS,
  TRADE_STATUS,
  type RentalStatus,
  type TradeStatus,
} from '@/shared/config/status';
import { CATEGORIES, CARBON_SECTOR_LABEL } from '@/shared/config/categories';
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
 * 아직 라우터와 실제 화면이 붙기 전 단계라, 지금까지 확정한 규격이
 * 제대로 동작하는지 눈으로 확인하기 위한 페이지다.
 * 5단계에서 router.tsx 가 들어오면 이 파일은 통째로 교체된다.
 */

const BRAND_STEPS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
] as const;

const BRAND_SWATCH: Record<(typeof BRAND_STEPS)[number], string> = {
  '50': 'bg-brand-50',
  '100': 'bg-brand-100',
  '200': 'bg-brand-200',
  '300': 'bg-brand-300',
  '400': 'bg-brand-400',
  '500': 'bg-brand-500',
  '600': 'bg-brand-600',
  '700': 'bg-brand-700',
  '800': 'bg-brand-800',
  '900': 'bg-brand-900',
};

const TRADE_STATUSES = Object.values(TRADE_STATUS) as TradeStatus[];
const RENTAL_STATUSES = Object.values(RENTAL_STATUS) as RentalStatus[];

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

export default function App() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <header className="mb-8">
        <p className="text-sm font-semibold text-brand-600">
          Looper · 캠퍼스 순환거래 플랫폼
        </p>
        <h1 className="mt-1 text-2xl font-bold">프로젝트 셋업 확인</h1>
        <p className="mt-2 text-sm text-ink-500">
          디자인 토큰과 상태·카테고리·탄소 계수 규격이 정상 동작하는지
          확인하는 임시 화면입니다. 라우터가 붙으면 교체됩니다.
        </p>
      </header>

      <div className="grid gap-5">
        <Section
          title="브랜드 컬러"
          note="목업에서 추출한 잠정값입니다. Figma 로컬 스타일 값이 오면 src/index.css 의 @theme 블록만 교체하면 됩니다."
        >
          <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
            {BRAND_STEPS.map((step) => (
              <div key={step}>
                <div
                  className={`h-12 rounded-btn border border-ink-200 ${BRAND_SWATCH[step]}`}
                />
                <p className="mt-1 text-center text-xs text-ink-500">{step}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="거래 상태 뱃지"
          note="라벨·색상은 전부 shared/config/status.ts 단일 출처에서 옵니다."
        >
          <div className="flex flex-wrap gap-2">
            {TRADE_STATUSES.map((s) => (
              <StatusBadge key={s} kind="trade" status={s} />
            ))}
            <StatusBadge
              kind="trade"
              status={TRADE_STATUS.RESERVED}
              tradeDate={FUTURE_DATE}
            />
          </div>
          <p className="mt-3 text-xs text-ink-400">
            마지막 뱃지는 거래 예정일이 미래일 때 자동으로 라벨이 바뀌는
            케이스입니다. 서버 상태는 그대로 RESERVED 입니다.
          </p>
        </Section>

        <Section title="대여 상태 뱃지">
          <div className="flex flex-wrap gap-2">
            {RENTAL_STATUSES.map((s) => (
              <StatusBadge key={s} kind="rental" status={s} />
            ))}
          </div>
        </Section>

        <Section
          title="카테고리 → 탄소 섹터 매핑"
          note="자유 입력 품목명을 3개 섹터로 정규화하는 일은 서버(LLM)가 합니다. 프론트는 매핑 폴백만 갖습니다."
        >
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c.code}
                className="rounded-chip bg-ink-50 px-3 py-1.5 text-xs text-ink-600"
              >
                {c.label}
                <span className="ml-1.5 text-ink-400">
                  {CARBON_SECTOR_LABEL[c.sector]}
                </span>
              </span>
            ))}
          </div>
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
                      {(SECTOR_FACTORS[sector].productionShare * 100).toFixed(1)}%
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
