import type { APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';

interface SeedNote {
  title: string;
  content?: string;
  tags?: string[];
}

interface ApiNote {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

// 테스트 준비는 UI가 아니라 API로 한다 (검증하려는 여정에만 UI 조작을 쓰기 위해)
export async function createNote(request: APIRequestContext, note: SeedNote): Promise<ApiNote> {
  const now = new Date().toISOString();
  const res = await request.post(`${API_URL}/notes`, {
    data: { content: '', ...note, createdAt: now, updatedAt: now },
  });
  return res.json();
}

export async function getNote(request: APIRequestContext, id: string): Promise<ApiNote> {
  const res = await request.get(`${API_URL}/notes/${id}`);
  return res.json();
}

// UI로 만든 노트는 id를 알 수 없으므로 제목 접두어로 찾아 정리한다
export async function deleteNotesByTitlePrefix(request: APIRequestContext, prefix: string) {
  const res = await request.get(`${API_URL}/notes`);
  const notes = (await res.json()) as ApiNote[];
  await Promise.all(
    notes
      .filter((note) => note.title.startsWith(prefix))
      .map((note) => request.delete(`${API_URL}/notes/${note.id}`)),
  );
}
