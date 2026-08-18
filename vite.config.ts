import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * GitHub Codespaces 는 개발 서버를 HTTPS(443)로 프록시한다.
 * 이 경우 HMR 웹소켓이 5173 으로 붙으려다 실패해서 코드를 고쳐도
 * 화면이 갱신되지 않으므로, clientPort 를 443 으로 맞춰준다.
 */
const isCodespaces = process.env.CODESPACES === 'true';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 컨테이너 밖(포트 포워딩)에서 접근할 수 있도록 0.0.0.0 바인딩
    host: true,
    port: 5173,
    strictPort: true,
    ...(isCodespaces ? { hmr: { clientPort: 443 } } : {}),
  },
});
