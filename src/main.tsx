import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/app/App';
import { warmUpServer } from '@/shared/api/client';
import { startMockWorker } from '@/mocks/browser';
import '@/index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root 엘리먼트를 찾을 수 없습니다.');

// Render 무료 플랜은 15분 무요청 시 잠든다. 앱이 뜨자마자 헬스체크를 던져
// 사용자가 로그인 화면을 보는 동안 서버가 기동하게 한다. (목업 모드면 건너뜀)
warmUpServer();

// 목업 워커는 첫 렌더 전에 켠다. 안 그러면 초기 요청이 워커를 지나쳐
// 실제 서버로 나가면서 목업이 동작하지 않는다.
void startMockWorker().then(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
