import { cn } from '@/shared/lib/cn';
import {
  APPLICATION_STATUS_META,
  OFFER_STATUS_META,
  OVERDUE_META,
  RENTAL_STATUS_META,
  TONE_CLASS,
  TRADE_STATUS_META,
  resolveTradeStatusLabel,
  type ApplicationStatus,
  type OfferStatus,
  type RentalStatus,
  type StatusMeta,
  type TradeStatus,
} from '@/shared/config/status';

/**
 * 거래·신청·대여·지원 상태 뱃지.
 *
 * 라벨과 색상은 전부 shared/config/status.ts 에서 온다.
 * 이 컴포넌트에 색상을 하드코딩하지 않는다 — 상태 표현이 여러 곳으로
 * 흩어지면 기획서 R5(상태 동기화 오류)가 화면에서 재현된다.
 */

type Props = { className?: string } & (
  | {
      kind: 'trade';
      status: TradeStatus;
      /** 예약 중일 때 '미래 날짜 예약 중'으로 구분하기 위한 거래 예정일 */
      availableDate?: string | null;
    }
  | { kind: 'application'; status: ApplicationStatus }
  | { kind: 'offer'; status: OfferStatus }
  | {
      kind: 'rental';
      status: RentalStatus;
      /**
       * 반납 지연은 status 와 독립된 불리언 플래그다.
       * true 면 상태 뱃지와 별개로 '반납 지연' 뱃지가 함께 나온다.
       */
      isOverdue?: boolean;
    }
);

const BASE_CLASS =
  'inline-flex shrink-0 items-center rounded-chip px-2.5 py-1 text-xs font-semibold whitespace-nowrap';

function Badge({
  meta,
  label,
  className,
}: {
  meta: StatusMeta;
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn(BASE_CLASS, TONE_CLASS[meta.tone], className)}>
      {label ?? meta.label}
    </span>
  );
}

export function StatusBadge(props: Props) {
  switch (props.kind) {
    case 'trade':
      return (
        <Badge
          meta={TRADE_STATUS_META[props.status]}
          label={resolveTradeStatusLabel(props.status, props.availableDate)}
          className={props.className}
        />
      );

    case 'application':
      return (
        <Badge
          meta={APPLICATION_STATUS_META[props.status]}
          className={props.className}
        />
      );

    case 'offer':
      return (
        <Badge
          meta={OFFER_STATUS_META[props.status]}
          className={props.className}
        />
      );

    case 'rental':
      // 지연은 상태를 덮어쓰지 않고 나란히 붙는다.
      // 서버가 IN_USE + is_overdue=true 같은 조합을 그대로 내려주기 때문이다.
      return (
        <span className="inline-flex flex-wrap items-center gap-1">
          <Badge
            meta={RENTAL_STATUS_META[props.status]}
            className={props.className}
          />
          {props.isOverdue && <Badge meta={OVERDUE_META} />}
        </span>
      );
  }
}
