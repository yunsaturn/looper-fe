import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@/shared/ui/Button';

/**
 * 렌더링 중 예외를 잡아 화면에 보여준다.
 *
 * 이게 없으면 React 18 은 예외가 난 순간 트리 전체를 언마운트해서
 * **아무 메시지 없는 흰 화면**만 남는다. 시연 중에 이런 화면이 뜨면
 * 원인을 찾을 단서가 하나도 없으므로, 최소한 오류 문구와 스택은
 * 화면에 남겨 둔다(캡처만 해도 원인을 특정할 수 있게).
 *
 * 서버 응답 자체의 실패(4xx·5xx)는 TanStack Query 의 `isError` →
 * `<ErrorState />` 가 담당한다. 여기서 잡히는 건 주로
 * "응답 형태가 예상과 달라서 렌더링 코드가 터진" 경우다.
 */
interface Props {
  children: ReactNode;
  /** 값이 바뀌면 오류 상태를 자동으로 푼다. 라우트 경로를 넘겨 쓴다. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 콘솔에도 남겨 둔다. 개발 중에는 이쪽이 스택이 더 자세하다.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="mx-auto grid max-w-lg gap-4 py-10 text-center">
        <div>
          <p className="text-3xl">😵</p>
          <h1 className="mt-3 text-lg font-bold text-ink-900">
            화면을 그리는 중 문제가 생겼어요
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            새로고침하면 대부분 해결돼요. 계속 같은 화면이 나오면 아래 내용을
            그대로 캡처해 주세요.
          </p>
        </div>

        <details className="rounded-card border border-ink-200 p-3 text-left">
          <summary className="cursor-pointer text-sm font-semibold text-ink-700">
            오류 내용 보기
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs text-ink-500">
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ''}
          </pre>
        </details>

        <div className="grid gap-2">
          <Button fullWidth onClick={() => this.setState({ error: null })}>
            다시 시도
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              window.location.href = '/';
            }}
          >
            홈으로
          </Button>
        </div>
      </div>
    );
  }
}

/** 라우트가 바뀌면 자동으로 복구되는 화면 단위 경계 */
export function RouteErrorBoundary({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) {
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}
