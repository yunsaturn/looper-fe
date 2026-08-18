import { Link } from 'react-router-dom';

import { buildPath, ROUTES } from '@/shared/config/navigation';
import { CATEGORY_LABEL, TRADE_TYPE_LABEL } from '@/shared/config/categories';
import { formatDate, formatPrice, formatRelative } from '@/shared/lib/format';
import type { TradeListItem } from '@/entities/trade/types';

import { StatusBadge } from './StatusBadge';
import { UserInline } from './TrustScoreBadge';

/**
 * 거래 게시물 카드. 홈 피드와 거래 목록에서 함께 쓴다.
 *
 * 폼팩터에 따라 방향이 바뀐다.
 *
 *   모바일 — 가로형. 왼쪽에 작은 썸네일, 오른쪽에 정보.
 *   데스크톱 — 세로형. 위쪽에 4:3 썸네일, 아래에 정보.
 *
 * 모바일은 한 줄에 카드 하나뿐이라(`LAYOUT.listGrid` 가 `grid-cols-1`),
 * 세로형을 그대로 쓰면 썸네일이 화면 폭을 다 먹어 한 화면에 카드가 한 장
 * 반밖에 안 들어온다. 목록은 훑어보는 화면이므로 그건 손해다. 그래서
 * 모바일에서만 가로형으로 눕히고 썸네일을 96px 로 고정한다. (Figma 기준)
 *
 * 방향이 바뀌면 여백을 주는 주체도 바뀐다. 가로형은 카드가 패딩을 갖고
 * 썸네일이 그 안에 둥근 모서리로 들어앉지만, 세로형은 썸네일이 카드
 * 상단에 꽉 차야 하므로 패딩을 본문 쪽으로 옮긴다.
 */
export function ItemCard({ item }: { item: TradeListItem }) {
  return (
    <Link
      to={buildPath(ROUTES.TRADE_DETAIL, { tradeId: item.id })}
      className="group flex gap-3 overflow-hidden rounded-card border border-ink-200 bg-white p-3 transition-colors hover:border-brand-300 md:flex-col md:gap-0 md:p-0"
    >
      {/*
       * 모바일에서는 높이를 지정하지 않는다. flex 기본값인 stretch 로
       * 본문 높이에 맞춰 늘어나므로 카드 아래쪽에 빈 칸이 생기지 않는다.
       */}
      <div className="w-24 shrink-0 overflow-hidden rounded-btn bg-ink-50 md:aspect-4/3 md:w-full md:rounded-none">
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

      <div className="flex min-w-0 grow flex-col gap-1.5 md:gap-2 md:p-3.5">
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

        <p className="line-clamp-2 text-sm font-medium text-ink-900 group-hover:text-brand-700 md:font-semibold">
          {item.title}
        </p>

        <p className="text-base font-bold text-ink-900">
          {formatPrice(item.price)}
        </p>

        <p className="truncate text-xs text-ink-400">
          {formatDate(item.available_date)} · {item.pickup_zone_name}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-0.5 md:pt-1">
          <UserInline
            nickname={item.author.nickname}
            trustScore={item.author.trust_score}
          />
          {/*
           * 가로형은 본문 폭이 좁아 '3시간 전' 까지 넣으면 작성자 이름이
           * 잘린다. 등록 시각보다 누가 올렸는지가 먼저라서 모바일에서는
           * 접는다. Figma 목록 카드에도 없다.
           */}
          {item.created_at && (
            <span className="hidden shrink-0 text-xs text-ink-400 md:inline">
              {formatRelative(item.created_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
