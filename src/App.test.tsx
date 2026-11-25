import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as api from './api/notes';
import type { Note } from './types/note';

// 실제 서버(db.json)를 건드리지 않도록 api 모듈 전체를 대체한다.
vi.mock('./api/notes');

function createTestNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'test-1',
    title: '제목 A',
    content: '내용 A',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// 카드의 개수 표시("태그 N")만 매칭한다. 편집기의 "태그 추가", "{태그} 태그 삭제"와 겹치지 않는다.
const TAG_COUNT_TEXT = /^태그 \d+$/;

describe('App 카드 태그 개수 (이슈 6)', () => {
  let serverNotes: Note[];

  beforeEach(() => {
    vi.clearAllMocks();
    serverNotes = [
      createTestNote({
        id: 'test-1',
        title: '제목 A',
        content: '내용 A',
        tags: ['react', 'design'],
      }),
      createTestNote({ id: 'test-2', title: '제목 B', content: '내용 B' }), // tags 필드 없음
    ];
    vi.mocked(api.fetchNotes).mockImplementation(async () => serverNotes);
    vi.mocked(api.updateNote).mockImplementation(async (id, updates) => {
      const updated = { ...serverNotes.find((n) => n.id === id)!, ...updates };
      serverNotes = serverNotes.map((n) => (n.id === id ? updated : n));
      return updated;
    });
    vi.mocked(api.createNote).mockImplementation(async (note) => {
      const created: Note = {
        id: 'test-new',
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        ...note,
      };
      serverNotes = [...serverNotes, created];
      return created;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  async function renderApp() {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: '제목 A' }); // 목록 로딩 완료
    return user;
  }

  async function openNote(user: ReturnType<typeof userEvent.setup>, title: string) {
    await user.click(screen.getByRole('heading', { name: title }));
    await screen.findByDisplayValue(title);
  }

  async function addTag(user: ReturnType<typeof userEvent.setup>, text: string) {
    await user.type(screen.getByLabelText('태그 입력'), `${text}{Enter}`);
  }

  // 이슈 6 P1
  it('should 태그 있는 노트 카드에만 "태그 2"가 표시되고 태그 없는 노트 카드에는 없음 when 목록이 로딩됨', async () => {
    await renderApp();

    expect(screen.getByText('태그 2')).toBeInTheDocument();
    expect(screen.getAllByText(TAG_COUNT_TEXT)).toHaveLength(1);
  });

  // 이슈 6 P3
  it('should 카드의 개수가 갱신 when 노트를 열어 태그를 추가하고 "저장"', async () => {
    const user = await renderApp();
    await openNote(user, '제목 A');
    await user.click(screen.getByRole('button', { name: '태그 추가' }));
    await addTag(user, 'vue');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('태그 3')).toBeInTheDocument();
    expect(screen.queryByText('태그 2')).not.toBeInTheDocument();
  });

  // 이슈 6 P6
  it('should 새 노트 카드에 "태그 2"가 표시 when "+ 새 노트"로 태그 2개를 추가해 저장', async () => {
    const user = await renderApp();
    await user.click(screen.getByRole('button', { name: '+ 새 노트' }));
    await user.type(screen.getByPlaceholderText('제목'), '새 제목');
    await user.click(screen.getByRole('button', { name: '태그 추가' }));
    await addTag(user, 'vue');
    await addTag(user, 'svelte');

    await user.click(screen.getByRole('button', { name: '저장' }));

    // 기존 노트(test-1)의 "태그 2"와 새 노트 카드의 "태그 2"가 함께 있어야 한다
    await waitFor(() => expect(screen.getAllByText('태그 2')).toHaveLength(2));
  });

  // 이슈 6 P2
  it('should 카드의 개수가 그대로 when 노트를 열어 태그를 추가했지만 저장하지 않음 (미저장 편집 미반영)', async () => {
    const user = await renderApp();
    await openNote(user, '제목 A');
    await user.click(screen.getByRole('button', { name: '태그 추가' }));

    await addTag(user, 'vue');

    expect(screen.getByText('vue')).toBeInTheDocument(); // 편집기에는 반영됨
    expect(screen.getByText('태그 2')).toBeInTheDocument();
    expect(screen.queryByText('태그 3')).not.toBeInTheDocument();
  });

  // 이슈 6 P4
  it('should 카드의 개수가 줄어듦 when 태그를 삭제하고 "저장"', async () => {
    const user = await renderApp();
    await openNote(user, '제목 A');
    await user.click(screen.getByRole('button', { name: 'react 태그 삭제' }));

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('태그 1')).toBeInTheDocument();
    expect(screen.queryByText('태그 2')).not.toBeInTheDocument();
  });

  // 이슈 6 P5
  it('should 카드의 개수 표시가 사라짐 when 마지막 태그를 모두 삭제하고 "저장"', async () => {
    const user = await renderApp();
    expect(screen.getByText('태그 2')).toBeInTheDocument(); // 삭제 전에는 개수가 표시되어 있다
    await openNote(user, '제목 A');
    await user.click(screen.getByRole('button', { name: 'react 태그 삭제' }));
    await user.click(screen.getByRole('button', { name: 'design 태그 삭제' }));

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(api.updateNote).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText(TAG_COUNT_TEXT)).not.toBeInTheDocument());
  });

  // 이슈 6 P7
  it('should 카드의 개수가 그대로 when 저장 중 updateNote가 reject', async () => {
    const user = await renderApp();
    vi.mocked(api.updateNote).mockRejectedValue(new Error('Failed to update note'));
    await openNote(user, '제목 A');
    await user.click(screen.getByRole('button', { name: '태그 추가' }));
    await addTag(user, 'vue');

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(api.updateNote).toHaveBeenCalled());
    expect(screen.getByText('태그 2')).toBeInTheDocument();
    expect(screen.queryByText('태그 3')).not.toBeInTheDocument();
  });
});
