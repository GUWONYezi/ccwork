import { test, expect, type Page } from '@playwright/test';
import { createNote, deleteNotesByTitlePrefix, getNote } from './helpers/notes';

const PREFIX = 'e2e-tag';

const uniqueTitle = (name: string) => `${PREFIX} ${name} ${Date.now()}`;

// 태그 입력창에서 Enter로 태그를 하나씩 추가한다
async function addTags(page: Page, ...tags: string[]) {
  await page.getByRole('button', { name: '태그 추가' }).click();
  const input = page.getByLabel('태그 입력');
  for (const tag of tags) {
    await input.fill(tag);
    await input.press('Enter');
  }
}

// 저장 버튼을 누르고 서버 응답이 끝날 때까지 기다린다
async function save(page: Page, method: 'POST' | 'PATCH') {
  const saved = page.waitForResponse(
    (res) => res.url().includes('/notes') && res.request().method() === method,
  );
  await page.getByRole('button', { name: '저장' }).click();
  await saved;
}

test.describe('태그', () => {
  test.afterEach(async ({ request }) => {
    await deleteNotesByTitlePrefix(request, PREFIX);
  });

  // 스토리: 태그 추가 / 상세 화면에서 태그 보기 / 목록에서 태그 노트 구분 / Enter 연속 추가 / 저장 시에만 서버 반영
  test('사용자가 기존 노트에 Enter로 태그를 추가하고 저장하면 새로고침 후에도 순서대로 보인다', async ({
    page,
    request,
  }) => {
    const title = uniqueTitle('추가');
    const note = await createNote(request, { title, content: '본문' });

    await page.goto('/');
    await page.getByText(title).click();
    await addTags(page, 'react', 'design');

    // 저장 전에는 서버에 반영되지 않는다
    expect((await getNote(request, note.id)).tags).toBeUndefined();

    await save(page, 'PATCH');

    await page.reload();
    await page.getByText(title).click();
    const deleteButtons = page.getByRole('button', { name: /태그 삭제$/ });
    await expect(deleteButtons).toHaveCount(2);
    await expect(deleteButtons.nth(0)).toHaveAccessibleName('react 태그 삭제');
    await expect(deleteButtons.nth(1)).toHaveAccessibleName('design 태그 삭제');
    await expect(page.getByText('태그 2', { exact: true })).toBeVisible();
  });

  // 스토리: 태그 삭제 / 상세 화면에서 태그 보기 / 목록에서 태그 노트 구분
  test('사용자가 태그를 삭제하고 저장하면 새로고침 후에도 삭제된 상태다', async ({
    page,
    request,
  }) => {
    const title = uniqueTitle('삭제');
    await createNote(request, { title, content: '본문', tags: ['react', 'design'] });

    await page.goto('/');
    await page.getByText(title).click();
    await expect(page.getByRole('button', { name: 'react 태그 삭제' })).toBeVisible();

    await page.getByRole('button', { name: 'react 태그 삭제' }).click();
    await save(page, 'PATCH');

    await page.reload();
    await page.getByText(title).click();
    await expect(page.getByRole('button', { name: 'design 태그 삭제' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'react 태그 삭제' })).toHaveCount(0);
    await expect(page.getByText('태그 1', { exact: true })).toBeVisible();
  });

  // 스토리: 노트에 태그 추가 (새 노트 작성 경로, POST)
  test('사용자가 새 노트에 태그를 붙여 저장하면 새로고침 후에도 목록에 태그가 남는다', async ({
    page,
  }) => {
    const title = uniqueTitle('새 노트');

    await page.goto('/');
    await page.getByRole('button', { name: '+ 새 노트' }).click();
    await page.getByLabel('노트 제목').fill(title);
    await addTags(page, 'react');
    await save(page, 'POST');

    await page.reload();
    await page.getByText(title).click();
    await expect(page.getByRole('button', { name: 'react 태그 삭제' })).toBeVisible();
    await expect(page.getByText('태그 1', { exact: true })).toBeVisible();
  });

  // 스토리: 태그가 없는 예전 노트도 에러 없이 열고 저장
  test('태그가 없는 기존 노트도 열어서 제목을 수정하고 저장할 수 있다', async ({
    page,
    request,
  }) => {
    const title = uniqueTitle('기존');
    const newTitle = `${title} 수정`;
    await createNote(request, { title, content: '예전 노트' });

    await page.goto('/');
    await page.getByText(title).click();
    await expect(page.getByLabel('노트 제목')).toHaveValue(title);

    await page.getByLabel('노트 제목').fill(newTitle);
    await save(page, 'PATCH');

    await page.reload();
    await expect(page.getByText(newTitle)).toBeVisible();
    await page.getByText(newTitle).click();
    await expect(page.getByLabel('노트 제목')).toHaveValue(newTitle);
    await expect(page.getByRole('button', { name: /태그 삭제$/ })).toHaveCount(0);
    await expect(page.getByText(/^태그 \d+$/)).toHaveCount(0);
  });
});
