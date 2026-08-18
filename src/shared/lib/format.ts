/** 날짜·시간·가격 표기 유틸. 화면마다 다르게 찍히지 않도록 한곳에 모은다. */

const KST = 'ko-KR';

/** '2026-08-21' → '8월 21일' */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** '2026-08-19T04:00:00Z' → '8월 19일 오후 1:00' */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(KST, {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** '2026-08-19T04:00:00Z' → '오후 1:00' */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(KST, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * **거래 가격·사용료** 표기. 12000 → '12,000원', 0 → '무료', 누락 → '가격 협의'
 *
 * ⚠️ 여기서 0 은 "값을 매기지 않았다"는 뜻이라 '무료'가 맞다.
 *    합계 금액(절약한 금액 등)에는 절대 쓰지 말 것 — 0원은 '무료'가 아니라
 *    '아직 없음'이므로 formatAmount 를 써야 한다.
 */
export function formatPrice(won?: number | null): string {
  if (won == null) return '가격 협의';
  return won === 0 ? '무료' : `${won.toLocaleString(KST)}원`;
}

/**
 * **합계 금액** 표기. 12000 → '12,000원', 0 → '0원', 누락 → '0원'
 *
 * 절약한 금액처럼 누적된 수치는 0 이어도 '0원'이다. formatPrice 를 쓰면
 * 아직 거래가 없는 사용자에게 "절약한 금액: 무료"라고 표시된다.
 */
export function formatAmount(won?: number | null): string {
  return `${(won ?? 0).toLocaleString(KST)}원`;
}

/** 며칠 남았는지. 오늘이면 'D-DAY', 지났으면 'D+n' */
export function formatDDay(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.round(
    (startOfDay(target) - startOfDay(now)) / 86_400_000,
  );

  if (diffDays === 0) return 'D-DAY';
  return diffDays > 0 ? `D-${diffDays}` : `D+${-diffDays}`;
}

/**
 * 반납까지 남은 시간. 이미 지났으면 초과 시간을 반환한다.
 * 대여 진행 화면에서 '2시간 15분 남음' / '30분 초과' 로 쓴다.
 */
export function formatRemaining(
  dueAt: string,
  now: Date = new Date(),
): { text: string; isOverdue: boolean } {
  const diffMs = new Date(dueAt).getTime() - now.getTime();
  const overdue = diffMs < 0;
  const totalMinutes = Math.floor(Math.abs(diffMs) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes}분`);

  const amount = parts.join(' ');
  return {
    text: overdue ? `${amount} 초과` : `${amount} 남음`,
    isOverdue: overdue,
  };
}

/** 상대 시간. '10분 전', '2시간 전', '3일 전' */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffMinutes = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / 60_000,
  );

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  return `${Math.floor(diffHours / 24)}일 전`;
}

/** 사용 시간(분)을 '1시간 30분' 으로 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** Date -> `<input type="date">` 이 요구하는 로컬 기준 'YYYY-MM-DD'. */
export function toLocalDateValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

/**
 * Date -> `<input type="datetime-local">` 이 요구하는 'YYYY-MM-DDTHH:mm'.
 *
 * toISOString() 은 UTC 라 그대로 넣으면 한국 기준 9시간이 밀린다.
 * 거래 약속·대여 시각 입력이 전부 이 변환을 쓰므로 한곳에 둔다.
 */
export function toLocalInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
