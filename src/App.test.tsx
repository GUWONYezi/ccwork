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
    // 개수 표시는 태그 있는 카드 1개뿐이어야 한다(태그 없는 카드로 새지 않음)
    expect(screen.getAllByText(TAG_COUNT_TEXT)).toHaveLength(1);
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

describe('App 휴지통 (Trash 이슈 1)', () => {
  let serverNotes: Note[];

  beforeEach(() => {
    vi.clearAllMocks();
    serverNotes = [
      createTestNote({ id: 'test-1', title: '제목 A', content: '내용 A' }),
      createTestNote({ id: 'test-2', title: '제목 B', content: '내용 B' }),
      createTestNote({
        id: 'test-3',
        title: '이미 삭제된 노트',
        content: '내용 C',
        deletedAt: '2025-01-10T12:00:00.000Z',
      }),
    ];
    vi.mocked(api.fetchNotes).mockImplementation(async () => serverNotes);
    vi.mocked(api.updateNote).mockImplementation(async (id, updates) => {
      const updated = { ...serverNotes.find((n) => n.id === id)!, ...updates };
      serverNotes = serverNotes.map((n) => (n.id === id ? updated : n));
      return updated;
    });
  });

  // 목록의 카드는 제목 텍스트로 찾고, 삭제 버튼은 카드 순서(제목 A=0, 제목 B=1)로 찾는다
  const deleteButtons = () => screen.getAllByRole('button', { name: '삭제' });

  it('should 선택 상태를 해제(에디터가 비어 있는 상태) when 선택 중인 노트를 삭제', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByText('제목 A'));
    expect(screen.getByRole('textbox', { name: '노트 제목' })).toHaveValue('제목 A');

    await user.click(deleteButtons()[0]);
    await user.click(await screen.findByRole('button', { name: '확인' }));

    expect(await screen.findByText('노트를 선택하거나 새 노트를 만드세요')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '노트 제목' })).not.toBeInTheDocument();
  });

  it('should 사이드바가 휴지통 목록으로 전환되고 일반 목록으로 돌아가는 버튼이 보임 when 휴지통 버튼 클릭', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('제목 A');

    await user.click(screen.getByRole('button', { name: '휴지통' }));

    expect(await screen.findByText('이미 삭제된 노트')).toBeInTheDocument();
    expect(screen.queryByText('제목 A')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /돌아가기/ })).toBeInTheDocument();
  });

  it('should 선택 상태를 유지 when 선택 중이 아닌 다른 노트를 삭제', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByText('제목 A'));

    await user.click(deleteButtons()[1]); // 제목 B 삭제
    await user.click(await screen.findByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.queryByText('제목 B')).not.toBeInTheDocument());
    expect(screen.getByRole('textbox', { name: '노트 제목' })).toHaveValue('제목 A');
  });
});

describe('App 휴지통 전환 (Trash 이슈 1, 추가 시나리오)', () => {
  let serverNotes: Note[];

  beforeEach(() => {
    vi.clearAllMocks();
    serverNotes = [
      createTestNote({ id: 'test-1', title: '제목 A', content: '내용 A' }),
      createTestNote({ id: 'test-2', title: '제목 B', content: '내용 B' }),
    ];
    vi.mocked(api.fetchNotes).mockImplementation(async () => serverNotes);
    vi.mocked(api.updateNote).mockImplementation(async (id, updates) => {
      const updated = { ...serverNotes.find((n) => n.id === id)!, ...updates };
      serverNotes = serverNotes.map((n) => (n.id === id ? updated : n));
      return updated;
    });
  });

  // 회귀 테스트: 기존 App의 sidebarView 전환이 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it('should 사이드바가 일반 노트 목록으로 복귀 when 휴지통 뷰에서 "목록으로 돌아가기" 클릭', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('제목 A');
    await user.click(screen.getByRole('button', { name: '휴지통' }));
    expect(screen.queryByText('제목 A')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /돌아가기/ }));

    expect(await screen.findByText('제목 A')).toBeInTheDocument();
    expect(screen.getByText('제목 B')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /돌아가기/ })).not.toBeInTheDocument();
  });

  // 회귀 테스트: 기존 NoteList/NotesContext/TrashList 조합이 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it('should 방금 삭제한 노트가 휴지통 뷰 목록에 표시되고 일반 목록에는 없음 when 노트 삭제 확인 후 휴지통 버튼 클릭', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('제목 A');
    await user.click(screen.getAllByRole('button', { name: '삭제' })[0]); // 제목 A 삭제
    await user.click(await screen.findByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByText('제목 A')).not.toBeInTheDocument());
    expect(screen.getByText('제목 B')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '휴지통' }));

    expect(await screen.findByText('제목 A')).toBeInTheDocument();
    expect(screen.queryByText('제목 B')).not.toBeInTheDocument();
  });
});
