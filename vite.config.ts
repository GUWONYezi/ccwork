import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // json-server가 노트를 저장할 때마다 db.json을 다시 쓴다. Tailwind가 이 파일을 스캔 대상으로
    // 등록해 두어서 감시에서 빼지 않으면 Vite가 페이지를 새로고침하고, 열려 있던 Alert 상태가 사라진다.
    watch: { ignored: ['**/db.json'] },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    // theme.test.ts가 index.css 원문(?raw)을 읽을 수 있도록 이 파일만 CSS 처리를 허용한다.
    css: { include: [/src\/index\.css/] },
  },
});
