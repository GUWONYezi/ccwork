import { test, expect } from '@playwright/test';

test('노트 목록이 표시된다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('첫 번째 노트')).toBeVisible();
  await expect(page.getByText('두 번째 노트')).toBeVisible();
});
