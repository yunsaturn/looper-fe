import type {
  CampusRanking,
  ForestProgress,
  TreeEquivalent,
} from '@/entities/impact/types';
import { cn } from '@/shared/lib/cn';
import { formatCarbon } from '@/shared/lib/carbon';

/**
 * 임팩트 대시보드 전용 카드들.
 *
 * 여기 있는 숫자는 전부 서버가 계산해 내려준 값이다. 화면에서 환산하거나
 * 추정하지 않는다 — 나무 환산 계수·순환숲 임계값·전월 대비 증감률·캠퍼스
 * 격차 모두 서버 응답 필드다. (기획서 R3: 검증 가능한 수치만 보여준다)
 */

/* ─────────────────── 큰 숫자 카드 ─────────────────── */

/**
 * 누적 절감량을 크게 보여주는 카드. 개인은 밝은 초록, 캠퍼스는 진한 초록.
 *
 * `disclaimer` 는 필수 prop 이다. 각주 없이 탄소 수치를 렌더링할 수 없게
 * 타입으로 막는다.
 */
export function CarbonBigCard({
  label,
  kgCO2e,
  badge,
  disclaimer,
  tone = 'light',
}: {
  label: string;
  kgCO2e: number;
  badge?: React.ReactNode;
  disclaimer: string;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <section
      className={cn(
        'flex flex-col justify-between rounded-card p-5',
        dark ? 'bg-brand-700 text-white' : 'bg-brand-400 text-brand-900',
      )}
    >
      <div>
        <p
          className={cn(
            'text-sm font-semibold',
            dark ? 'text-white/85' : 'text-brand-900/80',
          )}
        >
          {label}
        </p>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight tabular-nums md:text-5xl">
            {Math.round(kgCO2e).toLocaleString('ko-KR')}
          </span>
          <span className="text-base font-bold">kgCO₂e</span>
        </p>
      </div>

      {badge && (
        <p
          className={cn(
            'mt-4 inline-flex w-fit items-center gap-1.5 rounded-chip px-3 py-1.5 text-xs font-semibold',
            dark ? 'bg-white/15 text-white' : 'bg-white/70 text-brand-800',
          )}
        >
          {badge}
        </p>
      )}

      <p
        className={cn(
          'mt-3 text-[11px] leading-relaxed',
          dark ? 'text-white/60' : 'text-brand-900/55',
        )}
      >
        {disclaimer}
      </p>
    </section>
  );
}

/* ─────────────────── 나무 환산 ─────────────────── */

/** 탄소량을 도시 묘목 그루 수로 환산해 보여준다 */
export function TreeEquivalentCard({
  equivalent,
  variant = 'sapling',
}: {
  equivalent: TreeEquivalent;
  variant?: 'sapling' | 'forest';
}) {
  const count = Math.round(equivalent.tree_count);
  const isForest = variant === 'forest';

  return (
    <section className="flex items-center gap-4 rounded-card border border-ink-200 p-4">
      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-card bg-brand-100">
        {isForest ? <ForestGlyph /> : <SaplingGlyph />}
      </div>

      <div className="min-w-0">
        <p className="text-base font-bold text-brand-600 md:text-lg">
          {isForest
            ? `약 ${count.toLocaleString('ko-KR')}그루 규모의 숲`
            : `도시 나무 묘목 약 ${count.toLocaleString('ko-KR')}그루`}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">
          {equivalent.growth_period_years}년 동안 흡수하는
          <br />
          탄소량과 비슷해요
        </p>
        <p className="mt-1.5 text-[11px] text-ink-400">
          기준 그루당 {equivalent.basis_kg_co2e_per_tree}kgCO₂e ·{' '}
          {equivalent.source}
        </p>
      </div>
    </section>
  );
}

/* ─────────────────── 나의 순환숲 ─────────────────── */

/** 누적 탄소가 쌓여 나무가 한 그루씩 늘어나는 진행도 */
export function ForestProgressCard({ forest }: { forest: ForestProgress }) {
  const percent = Math.round(forest.progress_to_next_tree * 100);
  // 나무가 많아도 카드가 넘치지 않게 한 줄까지만 그린다
  const glyphCount = Math.min(forest.current_trees, 6);

  return (
    <section className="flex flex-col rounded-card border border-ink-200 p-4">
      <div>
        <h3 className="text-sm font-bold text-ink-900">나의 순환숲</h3>
        <p className="mt-0.5 text-xs text-ink-500">
          현재 나무 {forest.current_trees.toLocaleString('ko-KR')}그루
        </p>
      </div>

      <div className="my-3 flex grow items-end justify-center gap-1">
        {glyphCount > 0 ? (
          Array.from({ length: glyphCount }, (_, i) => (
            <SaplingGlyph key={i} className="h-10 w-10" />
          ))
        ) : (
          <p className="py-3 text-center text-xs text-ink-400">
            첫 거래를 완료하면 나무가 자라기 시작해요
          </p>
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-ink-600">
            다음 나무까지{' '}
            <strong className="font-bold text-ink-900">{percent}%</strong>
          </span>
          <span className="text-ink-500 tabular-nums">
            {Math.round(forest.carbon_toward_next_tree_kg_co2e)} /{' '}
            {Math.round(forest.next_tree_threshold_kg_co2e)} kgCO₂e
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-chip bg-brand-100">
          <div
            className="h-full rounded-chip bg-brand-500 transition-[width]"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── 캠퍼스 순환 랭킹 ─────────────────── */

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * 상위 캠퍼스 시상대 + 우리 캠퍼스 카드.
 *
 * 시상대는 1위를 가운데 두고 2·3위를 양옆에 둔다. 막대 높이는 1위 대비
 * 비율이라 순위 차이가 눈으로 읽힌다.
 */
export function CampusRankingSection({ ranking }: { ranking: CampusRanking }) {
  const top = ranking.top_campuses ?? [];
  const mine = ranking.my_campus;

  // 시상대 순서: 2위 · 1위 · 3위
  const podium = [top[1], top[0], top[2]].filter(Boolean);
  const maxKg = Math.max(
    ...top.map((c) => c.estimated_carbon_saved_kg_co2e),
    1,
  );

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-3 rounded-card border border-ink-200 p-4">
          {podium.map((campus) => {
            const heightRatio = campus.estimated_carbon_saved_kg_co2e / maxKg;
            return (
              <div
                key={campus.campus_id}
                className="flex w-1/3 max-w-28 flex-col items-center"
              >
                <p className="truncate text-center text-xs font-semibold text-ink-700">
                  {campus.display_name}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-xs tabular-nums',
                    campus.rank === 1
                      ? 'font-bold text-brand-600'
                      : 'text-ink-500',
                  )}
                >
                  {Math.round(
                    campus.estimated_carbon_saved_kg_co2e,
                  ).toLocaleString('ko-KR')}{' '}
                  kg
                </p>
                <div
                  className={cn(
                    'mt-2 flex w-full items-end justify-center rounded-t-card pb-2',
                    campus.rank === 1
                      ? 'bg-brand-700'
                      : campus.mine
                        ? 'bg-brand-300'
                        : 'bg-brand-200',
                  )}
                  style={{ height: `${56 + heightRatio * 64}px` }}
                >
                  <span aria-hidden className="text-2xl">
                    {MEDALS[campus.rank - 1] ?? ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mine && (
        <div className="rounded-card border border-brand-300 bg-brand-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-ink-500">우리 캠퍼스</p>
              <p className="truncate text-lg font-bold text-ink-900">
                {mine.display_name}
              </p>
              <p className="mt-0.5 text-sm text-ink-600 tabular-nums">
                {formatCarbon(mine.estimated_carbon_saved_kg_co2e)}
              </p>
            </div>
            <p className="shrink-0 text-2xl font-extrabold text-brand-700 tabular-nums">
              {mine.rank}
              <span className="ml-0.5 text-base font-bold">위</span>
            </p>
          </div>

          {ranking.carbon_to_next_rank_kg_co2e != null && mine.rank > 1 && (
            <div className="mt-4">
              <p className="text-xs text-ink-600">
                {mine.rank - 1}위까지{' '}
                <strong className="font-bold text-ink-900">
                  {Math.round(
                    ranking.carbon_to_next_rank_kg_co2e,
                  ).toLocaleString('ko-KR')}{' '}
                  kgCO₂e
                </strong>{' '}
                남았어요
              </p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-chip bg-brand-200">
                <div
                  className="h-full rounded-chip bg-brand-500"
                  style={{
                    width: `${gapProgress(
                      mine.estimated_carbon_saved_kg_co2e,
                      ranking.carbon_to_next_rank_kg_co2e,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {mine.rank === 1 && (
            <p className="mt-4 text-xs font-semibold text-brand-700">
              전체 캠퍼스 중 1위예요. 이대로 이어가요!
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** 다음 순위까지의 진행도 — 내 누적이 목표에서 차지하는 비율 */
function gapProgress(mineKg: number, gapKg: number): number {
  const target = mineKg + gapKg;
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, (mineKg / target) * 100));
}

/* ─────────────────── 일러스트 ─────────────────── */

function SaplingGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-12 w-12', className)}
      aria-hidden="true"
    >
      <circle cx="24" cy="18" r="11" className="fill-brand-500" />
      <circle cx="16" cy="23" r="7" className="fill-brand-600" />
      <circle cx="32" cy="23" r="7" className="fill-brand-600" />
      <rect
        x="22"
        y="27"
        width="4"
        height="14"
        rx="1.5"
        className="fill-brand-800"
      />
    </svg>
  );
}

function ForestGlyph() {
  return (
    <svg viewBox="0 0 96 48" className="h-12 w-20" aria-hidden="true">
      {[
        { x: 14, s: 0.8 },
        { x: 34, s: 1 },
        { x: 56, s: 0.9 },
        { x: 78, s: 0.75 },
      ].map((t) => (
        <g key={t.x} transform={`translate(${t.x} 44) scale(${t.s})`}>
          <path d="M0 -34 L11 -14 L-11 -14 Z" className="fill-brand-500" />
          <path d="M0 -24 L13 -2 L-13 -2 Z" className="fill-brand-600" />
          <rect x="-2" y="-3" width="4" height="7" className="fill-brand-800" />
        </g>
      ))}
    </svg>
  );
}
