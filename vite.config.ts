import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    // theme.test.ts가 index.css 원문(?raw)을 읽을 수 있도록 이 파일만 CSS 처리를 허용한다.
    css: { include: [/src\/index\.css/] },
  },
});
