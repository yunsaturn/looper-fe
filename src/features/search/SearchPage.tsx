import { useState } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { searchApi } from '@/entities/search/api';
import {
  SEARCH_SCOPE,
  SEARCH_SCOPE_LABEL,
  type SearchScope,
} from '@/entities/search/types';
import { tradeApi } from '@/entities/trade/api';
import { rentalApi } from '@/entities/rental/api';
import type { TradeListItem } from '@/entities/trade/types';
import type { RentalListItem } from '@/entities/rental/types';
import type { PageResponse } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { buildPath, LAYOUT, ROUTES } from '@/shared/config/navigation';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Field';
import { FilterChips } from '@/shared/ui/FilterChips';
import { ItemCard } from '@/shared/ui/ItemCard';
import { RentalCard } from '@/shared/ui/RentalCard';
import {
  CardSkeletonGrid,
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/ui/feedback';

/**
 * 통합 검색 — 거래와 대여를 한 번에 찾는다.
 *
 * 세 갈래로 동작한다.
 *   1) 검색어가 없으면    → 최근 거래·대여를 목록으로 보여준다(빈 화면 금지).
 *   2) 검색어가 있으면    → /api/v1/search 통합검색(형태소 정규화·동의어 확장).
 *   3) 통합검색이 비면    → 거래·대여 목록 API 의 keyword 검색으로 폴백한다.
 *
 * normalized_query·expanded_terms 를 보여주는 건 "왜 이 결과가 나왔는지"를
 * 납득시키기 위함이다. 최근 항목·폴백은 목록 API 를 쓰므로 ItemCard·
 * RentalCard 를 그대로 재사용한다.
 */
const SCOPE_OPTIONS = [
  { value: SEARCH_SCOPE.TRADE, label: SEARCH_SCOPE_LABEL.TRADE },
  { value: SEARCH_SCOPE.RENTAL, label: SEARCH_SCOPE_LABEL.RENTAL },
] as const;

/** 통합검색 페이지 크기 */
const PAGE_SIZE = 20;
/** 최근·폴백 목록에서 자원별로 가져올 개수 */
const BROWSE_SIZE = 8;

export function SearchPage() {
  const [input, setInput] = useState('');
  /** 실제로 서버에 보낸 검색어. 타이핑마다 요청하지 않는다 */
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope | undefined>();
  const [page, setPage] = useState(0);

  const hasQuery = query.trim().length > 0;
  const wantTrades = scope !== SEARCH_SCOPE.RENTAL; // 전체 또는 거래
  const wantRentals = scope !== SEARCH_SCOPE.TRADE; // 전체 또는 대여

  const searchParams = {
    query,
    scope: scope ?? SEARCH_SCOPE.ALL,
    page,
    size: PAGE_SIZE,
  };

  const search = useQuery({
    queryKey: queryKeys.search(searchParams),
    queryFn: () => searchApi.search(searchParams),
    enabled: hasQuery,
  });

  const data = search.data;
  const searchResults = data?.results ?? [];
  const totalPages = data ? Math.ceil(data.total_elements / PAGE_SIZE) : 0;

  /* 통합검색이 끝났는데 결과가 비면 목록 API 로 폴백한다 */
  const searchEmpty =
    hasQuery && search.isSuccess && searchResults.length === 0;
  /* 검색어가 없거나(최근) 통합검색이 비면(폴백) 목록 API 를 쓴다 */
  const useLists = !hasQuery || searchEmpty;
  const listKeyword = hasQuery ? query.trim() : undefined;

  const browseTrades = useQuery({
    queryKey: queryKeys.trades.list({
      ctx: 'search',
      keyword: listKeyword ?? null,
      size: BROWSE_SIZE,
    }),
    queryFn: () => tradeApi.list({ keyword: listKeyword, size: BROWSE_SIZE }),
    enabled: useLists && wantTrades,
  });
  const browseRentals = useQuery({
    queryKey: queryKeys.rentals.list({
      ctx: 'search',
      keyword: listKeyword ?? null,
      size: BROWSE_SIZE,
    }),
    queryFn: () => rentalApi.list({ keyword: listKeyword, size: BROWSE_SIZE }),
    enabled: useLists && wantRentals,
  });

  const submit = (next: string) => {
    setInput(next);
    setQuery(next.trim());
    setPage(0);
  };

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink-900 md:text-2xl">검색</h1>
        <p className="mt-1 text-sm text-ink-500">
          거래와 대여를 한 번에 찾아봐요.
        </p>
      </div>

      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <Input
          label="검색어"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예: 공학용 계산기, 우산"
          autoComplete="off"
        />
        <FilterChips
          options={SCOPE_OPTIONS}
          value={scope}
          onChange={(next) => {
            setScope(next);
            setPage(0);
          }}
          allLabel={SEARCH_SCOPE_LABEL.ALL}
        />
      </form>

      {/* 검색어를 어떻게 해석했는지 — 결과가 기대와 다를 때의 단서 */}
      {data &&
        searchResults.length > 0 &&
        data.normalized_query !== data.original_query && (
          <p className="text-xs text-ink-500">
            <strong className="font-semibold text-ink-700">
              {data.normalized_query}
            </strong>{' '}
            로 검색했어요
            {data.expanded_terms?.length
              ? ` · 비슷한 말: ${data.expanded_terms.join(', ')}`
              : ''}
          </p>
        )}

      {hasQuery && search.isPending ? (
        <div className="grid gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : hasQuery && search.isError ? (
        <ErrorState error={search.error} onRetry={() => search.refetch()} />
      ) : data && searchResults.length > 0 ? (
        <>
          <p className="text-sm text-ink-500">
            총 {data.total_elements.toLocaleString('ko-KR')}건
          </p>

          <ul className="grid gap-2">
            {searchResults.map((item) => (
              <li key={`${item.resource_type}-${item.id}`}>
                <Link
                  to={
                    item.resource_type === 'TRADE'
                      ? buildPath(ROUTES.TRADE_DETAIL, { tradeId: item.id })
                      : buildPath(ROUTES.RENTAL_DETAIL, { rentalId: item.id })
                  }
                  className="flex items-center gap-3 rounded-card border border-ink-200 p-3 transition-colors hover:border-brand-300"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-btn bg-ink-100">
                    {item.thumbnail_url && (
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 grow">
                    <span className="rounded-chip bg-ink-50 px-2 py-0.5 text-[11px] text-ink-500">
                      {item.resource_type === 'TRADE' ? '거래' : '대여'}
                    </span>
                    <p className="mt-1 truncate text-sm font-semibold text-ink-900">
                      {item.title}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                이전
              </Button>
              <span className="text-sm text-ink-500 tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </>
      ) : (
        <BrowseResults
          heading={hasQuery ? '목록에서 찾은 결과' : '최근 거래·대여'}
          note={
            hasQuery
              ? `'${query.trim()}' 통합검색 결과가 없어 목록에서 찾아봤어요.`
              : '검색어를 입력하면 더 정확하게 찾아드려요.'
          }
          wantTrades={wantTrades}
          wantRentals={wantRentals}
          trades={browseTrades}
          rentals={browseRentals}
          emptyTitle={
            hasQuery ? `'${query.trim()}' 결과가 없어요` : '아직 항목이 없어요'
          }
          emptyDescription={
            hasQuery
              ? '다른 검색어를 써보거나 아래 추천을 눌러보세요.'
              : '거래나 대여가 등록되면 여기에 보여요.'
          }
          suggestions={data?.suggestions}
          onPick={submit}
        />
      )}
    </div>
  );
}

/**
 * 최근 항목·폴백을 공통으로 그리는 조각.
 *
 * 거래·대여 목록 API 결과를 받아 ItemCard·RentalCard 로 재사용해 보여준다.
 * 로딩·오류·빈 결과를 각각 처리한다.
 */
function BrowseResults({
  heading,
  note,
  wantTrades,
  wantRentals,
  trades,
  rentals,
  emptyTitle,
  emptyDescription,
  suggestions,
  onPick,
}: {
  heading: string;
  note?: string;
  wantTrades: boolean;
  wantRentals: boolean;
  trades: UseQueryResult<PageResponse<TradeListItem>>;
  rentals: UseQueryResult<PageResponse<RentalListItem>>;
  emptyTitle: string;
  emptyDescription: string;
  suggestions?: string[];
  onPick: (keyword: string) => void;
}) {
  const tradeItems = wantTrades ? (trades.data?.content ?? []) : [];
  const rentalItems = wantRentals ? (rentals.data?.content ?? []) : [];

  const isPending =
    (wantTrades && trades.isPending) || (wantRentals && rentals.isPending);
  /* 요청한 목록이 전부 실패했을 때만 오류로 처리한다(부분 성공은 살린다) */
  const allErrored =
    (!wantTrades || trades.isError) && (!wantRentals || rentals.isError);
  const isEmpty = tradeItems.length === 0 && rentalItems.length === 0;

  const retry = () => {
    if (wantTrades) trades.refetch();
    if (wantRentals) rentals.refetch();
  };

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-base font-bold text-ink-900">{heading}</h2>
        {note && <p className="mt-0.5 text-xs text-ink-500">{note}</p>}
      </div>

      {isPending ? (
        <CardSkeletonGrid className={LAYOUT.listGrid} />
      ) : allErrored ? (
        <ErrorState error={trades.error ?? rentals.error} onRetry={retry} />
      ) : isEmpty ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            suggestions?.length ? (
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onPick(s)}
                    className="rounded-chip border border-ink-200 px-3 py-1.5 text-sm text-ink-600 hover:border-brand-300 hover:text-brand-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : undefined
          }
        />
      ) : (
        <>
          {wantTrades && tradeItems.length > 0 && (
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-ink-700">거래</h3>
              <div className={LAYOUT.listGrid}>
                {tradeItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {wantRentals && rentalItems.length > 0 && (
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-ink-700">대여</h3>
              <div className={LAYOUT.rentalGrid}>
                {rentalItems.map((item) => (
                  <RentalCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
