import { ErrorBoundary } from './ErrorBoundary';
import { Providers } from './providers';
import { AppRouter } from './router';

export default function App() {
  return (
    // 최후의 안전망. 레이아웃 바깥에서 터진 예외까지 흰 화면 대신 문구로 보여준다.
    <ErrorBoundary>
      <Providers>
        <AppRouter />
      </Providers>
    </ErrorBoundary>
  );
}
