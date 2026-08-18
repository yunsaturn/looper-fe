import { useQuery } from '@tanstack/react-query';

import { tradeApi } from '@/entities/trade/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/store/authStore';
import { ItemCard } from '@/shared/ui/ItemCard';
import { CardSkeletonGrid, EmptyState, ErrorState } from '@/shared/ui/feedback';
import { PageTitle } from '@/app/layouts/StackLayout';
import { Link } from 'react-router-dom';

/**
 * 내가 쓴 글.
 *
 * ⚠️ 서버에 작성자 필터가 없다. `GET /api/v1/trades` 는 keyword·trade_type·
 *    category·status·날짜·픽업존만 받는다. 그래서 내 캠퍼스 목록을 한 페이지
 *    크게 받아 화면에서 작성자로 거른다.
 *
 *    목록이 캠퍼스 단위라 시연 규모에서는 문제가 없지만, 게시물이 PAGE_SIZE 를
 *    넘어가면 그 뒤의 내 글은 안 보인다. 제대로 하려면 BE 에 author_id 필터나
 *    `GET /api/v1/users/me/trades` 가 필요하다.
 */
const PAGE_SIZE = 100;

export function MyTradesPage() {
  const myUserId = useAuthStore((s) => s.userId);

  const trades = useQuery({
    queryKey: queryKeys.trades.list({ size: PAGE_SIZE }),
    queryFn: () => tradeApi.list({ size: PAGE_SIZE }),
  });

  const mine = (trades.data?.content ?? []).filter(
    (t) => t.author.id === myUserId,
  );

  return (
    <>
      <PageTitle
        title="내가 쓴 글"
        description="등록한 게시물과 현재 상태를 확인해요."
      />

      {trades.isPending ? (
        <CardSkeletonGrid className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" />
      ) : trades.isError ? (
        <ErrorState error={trades.error} onRetry={() => trades.refetch()} />
      ) : mine.length === 0 ? (
        <EmptyState
          title="아직 등록한 글이 없어요"
          description="쓰지 않는 물건을 올리면 캠퍼스 안에서 한 번 더 순환해요."
          action={
            <Link
              to={ROUTES.TRADE_NEW}
              className="inline-flex h-10 items-center rounded-btn bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              게시물 등록하기
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-500">총 {mine.length}건</p>
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mine.map((trade) => (
              <li key={trade.id}>
                <ItemCard item={trade} />
              </li>
            ))}
          </ul>
          {trades.data?.has_next && (
            <p className="mt-4 text-xs text-ink-400">
              캠퍼스 게시물이 {PAGE_SIZE}건을 넘어 일부만 확인했어요.
            </p>
          )}
        </>
      )}
    </>
  );
}
