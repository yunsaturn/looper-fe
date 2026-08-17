import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { tradeApi } from '@/entities/trade/api';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  CATEGORY_FILTERS,
  CATEGORY_LABEL,
  TRADE_TYPE_FILTERS,
  TRADE_TYPE_LABEL,
  type Category,
  type TradeType,
} from '@/shared/config/categories';
import { LAYOUT, ROUTES } from '@/shared/config/navigation';
import { Button } from '@/shared/ui/Button';
import { FilterChips } from '@/shared/ui/FilterChips';
import { Input } from '@/shared/ui/Field';
import { ItemCard } from '@/shared/ui/ItemCard';
import {
  CardSkeletonGrid,
  EmptyState,
  ErrorState,
} from '@/shared/ui/feedback';

/** 물품 탐색 — 통합검색 + 거래유형·카테고리 필터 */
export function TradeListPage() {
  const navigate = useNavigate();

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [tradeType, setTradeType] = useState<TradeType | undefined>();
  const [category, setCategory] = useState<Category | undefined>();

  const filters = {
    keyword: keyword || undefined,
    trade_type: tradeType,
    category,
    size: 24,
  };

  const trades = useQuery({
    queryKey: queryKeys.trades.list(filters),
    queryFn: () => tradeApi.list(filters),
  });

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink-900 md:text-2xl">물품 탐색</h1>
        <p className="mt-1 text-sm text-ink-500">
          같은 캠퍼스 구성원이 올린 물건을 찾아보세요
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setKeyword(keywordInput);
        }}
      >
        <Input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="물건 이름, 카테고리로 검색"
          aria-label="검색어"
        />
      </form>

      <div className="grid gap-3">
        <FilterChips
          options={TRADE_TYPE_FILTERS.map((t) => ({
            value: t,
            label: TRADE_TYPE_LABEL[t],
          }))}
          value={tradeType}
          onChange={setTradeType}
          allLabel="전체 유형"
        />
        <FilterChips
          options={CATEGORY_FILTERS.map((c) => ({
            value: c,
            label: CATEGORY_LABEL[c],
          }))}
          value={category}
          onChange={setCategory}
          allLabel="전체 카테고리"
        />
      </div>

      {trades.isPending ? (
        <CardSkeletonGrid className={LAYOUT.listGrid} />
      ) : trades.isError ? (
        <ErrorState error={trades.error} onRetry={() => trades.refetch()} />
      ) : trades.data.content.length ? (
        <>
          <p className="text-sm text-ink-500">
            총 {trades.data.total_elements.toLocaleString('ko-KR')}건
          </p>
          <div className={LAYOUT.listGrid}>
            {trades.data.content.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="조건에 맞는 물건이 없어요"
          description="검색어를 바꾸거나 다른 카테고리를 살펴보세요."
          action={
            <Button size="sm" onClick={() => navigate(ROUTES.TRADE_NEW)}>
              직접 등록하기
            </Button>
          }
        />
      )}
    </div>
  );
}
