import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // 모든 테스트가 같은 json-server DB를 공유하므로 직렬 실행
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/start-api.mjs',
      url: 'http://localhost:3001/notes',
      reuseExistingServer: false, // 개발용 db.json 서버를 재사용하면 실제 데이터가 변경됨
    },
    {
      command: 'npx vite',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
  ],
});
