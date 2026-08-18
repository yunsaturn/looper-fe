import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { searchApi } from '@/entities/search/api';
import {
  SEARCH_SCOPE,
  SEARCH_SCOPE_LABEL,
  type SearchScope,
} from '@/entities/search/types';
import { queryKeys } from '@/shared/api/queryKeys';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Field';
import { FilterChips } from '@/shared/ui/FilterChips';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/feedback';

/**
 * 통합 검색 — 거래와 대여를 한 번에 찾는다.
 *
 * 서버가 형태소 정규화와 동의어 확장을 거쳐 결과를 준다. 검색어를 어떻게
 * 해석했는지(normalized_query, expanded_terms)를 화면에 보여주는 이유는,
 * 기대와 다른 결과가 나왔을 때 사용자가 원인을 알 수 있어야 하기 때문이다.
 * "왜 이게 나왔지?" 를 남기면 검색을 못 믿게 된다.
 */
const SCOPE_OPTIONS = [
  { value: SEARCH_SCOPE.TRADE, label: SEARCH_SCOPE_LABEL.TRADE },
  { value: SEARCH_SCOPE.RENTAL, label: SEARCH_SCOPE_LABEL.RENTAL },
] as const;

const PAGE_SIZE = 20;

export function SearchPage() {
  const [input, setInput] = useState('');
  /** 실제로 서버에 보낸 검색어. 타이핑마다 요청하지 않는다 */
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope | undefined>();
  const [page, setPage] = useState(0);

  const params = {
    query,
    scope: scope ?? SEARCH_SCOPE.ALL,
    page,
    size: PAGE_SIZE,
  };

  const search = useQuery({
    queryKey: queryKeys.search(params),
    queryFn: () => searchApi.search(params),
    enabled: query.trim().length > 0,
  });

  const submit = (next: string) => {
    setInput(next);
    setQuery(next.trim());
    setPage(0);
  };

  const data = search.data;
  const results = data?.results ?? [];
  const totalPages = data ? Math.ceil(data.total_elements / PAGE_SIZE) : 0;

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
      {data && data.normalized_query !== data.original_query && (
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

      {!query ? (
        <EmptyState
          title="무엇을 찾고 계신가요?"
          description="물건 이름이나 카테고리로 검색해 보세요."
        />
      ) : search.isPending ? (
        <div className="grid gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : search.isError ? (
        <ErrorState error={search.error} onRetry={() => search.refetch()} />
      ) : results.length === 0 ? (
        <EmptyState
          title={`'${data?.original_query}' 결과가 없어요`}
          description="다른 검색어를 써보거나 아래 추천을 눌러보세요."
          action={
            data?.suggestions?.length ? (
              <div className="flex flex-wrap justify-center gap-2">
                {data.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
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
          <p className="text-sm text-ink-500">
            총 {data?.total_elements.toLocaleString('ko-KR')}건
          </p>

          <ul className="grid gap-2">
            {results.map((item) => (
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
      )}
    </div>
  );
}
