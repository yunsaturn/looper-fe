/**
 * 조건부 className 결합 유틸.
 * falsy 값을 걸러내고 공백으로 이어붙인다.
 *
 *   cn('px-4', isActive && 'bg-brand-500', className)
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}
