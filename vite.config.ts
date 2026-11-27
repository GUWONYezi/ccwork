import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // json-server가 db.json(E2E는 임시 DB)을 쓸 때 Vite가 페이지를 새로고침해 화면 상태가 초기화되지 않게 한다
    watch: { ignored: ['**/db.json', '**/e2e/.db.tmp.json'] },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.test.{ts,tsx}', 'src/test-setup.ts', 'src/types/**'],
    },
  },
});
