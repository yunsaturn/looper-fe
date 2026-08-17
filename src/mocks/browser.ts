/**
 * MSW 목업 서버 기동.
 *
 * 두 가지 용도가 있다.
 *   1. BE 없이 전체 화면을 개발·시연한다
 *   2. 시연 중 서버나 AI 에 문제가 생기면 되돌릴 폴백 (기획서 R2·R4)
 *
 * msw 와 핸들러는 **동적 import** 로 불러온다. 정적 import 로 두면
 * VITE_USE_MOCK=false 인 프로덕션 번들에도 msw 전체(약 400KB)가 포함된다.
 * 이렇게 두면 Vite 가 별도 청크로 분리해 실서버 빌드에서는 받지 않는다.
 */
export async function startMockWorker(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return;

  const [{ setupWorker }, { handlers }] = await Promise.all([
    import('msw/browser'),
    import('./handlers'),
  ]);

  await setupWorker(...handlers).start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
