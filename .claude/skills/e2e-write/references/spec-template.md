# E2E 스펙 템플릿

`e2e/{feature}.spec.ts`와 공용 헬퍼의 기준 형태다. 이미 `e2e/helpers/notes.ts`가 있으면 그것을 재사용하고 새로 만들지 않는다.

## 헬퍼: `e2e/helpers/notes.ts`

테스트 준비/정리는 UI가 아니라 API로 한다. 느리고 깨지기 쉬운 UI 조작을 검증하려는 여정에만 쓰기 위해서다.

```ts
import type { APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';

interface SeedNote {
  title: string;
  content?: string;
  tags?: string[];
}

export async function createNote(request: APIRequestContext, note: SeedNote) {
  const now = new Date().toISOString();
  const res = await request.post(`${API_URL}/notes`, {
    data: { content: '', ...note, createdAt: now, updatedAt: now },
  });
  return (await res.json()) as { id: string; title: string };
}

export async function deleteNote(request: APIRequestContext, id: string) {
  await request.delete(`${API_URL}/notes/${id}`);
}

export async function getNote(request: APIRequestContext, id: string) {
  const res = await request.get(`${API_URL}/notes/${id}`);
  return res.json();
}
```

- 필드는 `src/types/note.ts`의 현재 `Note`와 맞춘다(기능이 필드를 추가하면 `SeedNote`도 확장한다).
- 고유 제목은 `` `태그 테스트 ${Date.now()}` `` 처럼 만든다.

## 스펙: `e2e/{feature}.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { createNote, deleteNote } from './helpers/notes';

test.describe('태그', () => {
  let noteId: string;
  const title = `태그 노트 ${Date.now()}`;

  test.beforeEach(async ({ request }) => {
    noteId = (await createNote(request, { title, content: '본문' })).id;
  });

  test.afterEach(async ({ request }) => {
    await deleteNote(request, noteId);
  });

  // 스토리: 노트 작성자로서 태그를 추가하고 저장하면 새로고침 후에도 남는다
  test('사용자가 태그를 추가하고 저장하면 새로고침 후에도 태그가 보인다', async ({ page }) => {
    await page.goto('/');
    await page.getByText(title).click();

    await page.getByRole('button', { name: '태그 추가' }).click();
    await page.getByLabel('태그 입력').fill('업무');
    await page.getByLabel('태그 입력').press('Enter');
    await page.getByRole('button', { name: '저장' }).click();

    await page.reload();
    await page.getByText(title).click();
    await expect(page.getByText('업무')).toBeVisible();
  });
});
```

위 문구('태그 추가', '저장', '태그 입력')는 예시다. 실제로는 1단계에서 컴포넌트를 읽어 확인한 이름만 쓴다.

## 체크리스트

- [ ] 모든 테스트가 자기 데이터를 만들고 지운다 (시드 순서 의존 없음)
- [ ] `waitForTimeout` 없음, 단언은 `expect(locator)` 자동 재시도
- [ ] 저장 스토리는 `page.reload()` 이후 확인
- [ ] 단위 테스트가 이미 보장하는 경계값 조합을 반복하지 않음
- [ ] Out of Scope 동작을 테스트하지 않음
- [ ] 각 테스트 위에 대응 스토리 주석
