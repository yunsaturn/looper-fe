import { Link } from 'react-router-dom';

import { buildPath, ROUTES } from '@/shared/config/navigation';
import { CATEGORY_LABEL, TRADE_TYPE_LABEL } from '@/shared/config/categories';
import { formatDate, formatPrice, formatRelative } from '@/shared/lib/format';
import type { TradeListItem } from '@/entities/trade/types';

import { StatusBadge } from './StatusBadge';
import { UserInline } from './TrustScoreBadge';

/** 거래 게시물 카드. 홈 피드와 거래 목록에서 함께 쓴다. */
export function ItemCard({ item }: { item: TradeListItem }) {
  return (
    <Link
      to={buildPath(ROUTES.TRADE_DETAIL, { tradeId: item.id })}
      className="group flex flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-colors hover:border-brand-300"
    >
      <div className="aspect-4/3 w-full bg-ink-50">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-300">
            이미지 없음
          </div>
        )}
      </div>

      <div className="flex grow flex-col gap-2 p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-chip bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-600">
            {TRADE_TYPE_LABEL[item.trade_type]}
          </span>
          <span className="rounded-chip bg-ink-50 px-2 py-0.5 text-xs text-ink-500">
            {CATEGORY_LABEL[item.category]}
          </span>
          <StatusBadge
            kind="trade"
            status={item.status}
            availableDate={item.available_date}
          />
        </div>

        <p className="line-clamp-2 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
          {item.title}
        </p>

        <p className="text-sm font-bold text-ink-900">
          {formatPrice(item.price)}
        </p>

        <p className="text-xs text-ink-400">
          {formatDate(item.available_date)} · {item.pickup_zone_name}
        </p>

        <div className="mt-auto flex items-center justify-between pt-1">
          <UserInline
            nickname={item.author.nickname}
            trustScore={item.author.trust_score}
          />
          {item.created_at && (
            <span className="text-xs text-ink-400">
              {formatRelative(item.created_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
