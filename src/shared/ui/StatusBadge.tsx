import { cn } from '@/shared/lib/cn';
import {
  RENTAL_STATUS_META,
  TONE_CLASS,
  TRADE_STATUS_META,
  resolveTradeStatusLabel,
  type RentalStatus,
  type TradeStatus,
} from '@/shared/config/status';

/**
 * 거래·대여 상태 뱃지.
 *
 * 라벨과 색상은 전부 shared/config/status.ts 에서 온다.
 * 이 컴포넌트에 색상을 하드코딩하지 않는다 — 상태 표현이 여러 곳으로
 * 흩어지면 기획서 R5(상태 동기화 오류)가 화면에서 재현된다.
 */

type Props =
  | {
      kind: 'trade';
      status: TradeStatus;
      /** 예약 중일 때 '미래 날짜 예약 중' 으로 구분하기 위한 거래 예정일 */
      tradeDate?: string | null;
      className?: string;
    }
  | {
      kind: 'rental';
      status: RentalStatus;
      className?: string;
    };

export function StatusBadge(props: Props) {
  const meta =
    props.kind === 'trade'
      ? TRADE_STATUS_META[props.status]
      : RENTAL_STATUS_META[props.status];

  const label =
    props.kind === 'trade'
      ? resolveTradeStatusLabel(props.status, props.tradeDate)
      : meta.label;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-chip px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        TONE_CLASS[meta.tone],
        props.className,
      )}
    >
      {label}
    </span>
  );
}
