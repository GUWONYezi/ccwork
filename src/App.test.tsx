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

describe('App 휴지통 미리보기 (Trash 이슈 2)', () => {
  let serverNotes: Note[];

  const GUIDE_TEXT = '노트를 선택하세요';
  const EDITOR_GUIDE_TEXT = '노트를 선택하거나 새 노트를 만드세요';

  beforeEach(() => {
    vi.clearAllMocks();
    serverNotes = [
      createTestNote({ id: 'test-1', title: '제목 A', content: '내용 A' }),
      createTestNote({
        id: 'test-3',
        title: '삭제된 노트 C',
        content: '내용 C',
        deletedAt: '2025-01-10T12:00:00.000Z',
      }),
      createTestNote({
        id: 'test-4',
        title: '삭제된 노트 D',
        content: '내용 D',
        deletedAt: '2025-01-05T12:00:00.000Z',
      }),
    ];
    vi.mocked(api.fetchNotes).mockImplementation(async () => serverNotes);
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

  async function openTrash() {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('제목 A'); // 목록 로딩 완료
    await user.click(screen.getByRole('button', { name: '휴지통' }));
    await screen.findByText('삭제된 노트 C');
    return user;
  }

  // 사이드바 항목이 선택 상태로 강조되어 있는지(제목 텍스트는 사이드바가 먼저 나온다)
  const isHighlighted = (title: string) =>
    screen.getAllByText(title)[0].closest('[aria-current="true"]') !== null;

  // A1
  it('should 메인 영역에 해당 노트의 제목과 내용을 표시하고 그 항목을 강조 when 휴지통 뷰에서 항목 클릭', async () => {
    const user = await openTrash();

    await user.click(screen.getByText('삭제된 노트 C'));

    expect(await screen.findByText('내용 C')).toBeInTheDocument();
    expect(screen.getAllByText('삭제된 노트 C')).toHaveLength(2); // 사이드바 + 메인
    expect(isHighlighted('삭제된 노트 C')).toBe(true);
    expect(isHighlighted('삭제된 노트 D')).toBe(false);
  });

  // A2
  it('should 메인 영역이 일반 NoteEditor로 돌아감 when 노트를 미리보기 중 "목록으로 돌아가기" 클릭', async () => {
    const user = await openTrash();
    await user.click(screen.getByText('삭제된 노트 C'));
    expect(await screen.findByText('내용 C')).toBeInTheDocument(); // 미리보기 중

    await user.click(screen.getByRole('button', { name: /돌아가기/ }));

    expect(await screen.findByText(EDITOR_GUIDE_TEXT)).toBeInTheDocument();
    expect(screen.queryByText('내용 C')).not.toBeInTheDocument();
    expect(screen.getByText('제목 A')).toBeInTheDocument();
  });

  // A3
  it('should 사이드바가 일반 목록으로 전환되고 빈 NoteEditor가 생성 모드로 열림 when 휴지통 뷰에서 헤더 "+ 새 노트" 클릭', async () => {
    const user = await openTrash();

    await user.click(screen.getByRole('button', { name: '+ 새 노트' }));

    expect(await screen.findByText('제목 A')).toBeInTheDocument();
    expect(screen.queryByText('삭제된 노트 C')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /돌아가기/ })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '노트 제목' })).toHaveValue('');
  });

  // A4
  it('should 미리보기가 사라지고 휴지통 선택이 해제됨 when 노트를 미리보기 중 "+ 새 노트" 클릭', async () => {
    const user = await openTrash();
    await user.click(screen.getByText('삭제된 노트 C'));
    expect(await screen.findByText('내용 C')).toBeInTheDocument(); // 미리보기 중

    await user.click(screen.getByRole('button', { name: '+ 새 노트' }));

    expect(screen.queryByText('내용 C')).not.toBeInTheDocument();
    // 휴지통을 다시 열면 이전 선택이 남아 있지 않다
    await user.click(await screen.findByRole('button', { name: '휴지통' }));
    expect(await screen.findByText(GUIDE_TEXT)).toBeInTheDocument();
    expect(screen.queryByText('내용 C')).not.toBeInTheDocument();
  });

  // A5
  it('should 새 노트가 일반 목록에 나타나고 휴지통에는 나타나지 않음 when 휴지통 뷰에서 "+ 새 노트"로 새 노트를 저장', async () => {
    const user = await openTrash();
    await user.click(screen.getByRole('button', { name: '+ 새 노트' }));
    await user.type(await screen.findByRole('textbox', { name: '노트 제목' }), '새 노트 제목');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('새 노트 제목')).toBeInTheDocument(); // 일반 목록
    expect(screen.getByText('제목 A')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '휴지통' }));
    expect(await screen.findByText('삭제된 노트 C')).toBeInTheDocument();
    expect(screen.queryByText('새 노트 제목')).not.toBeInTheDocument();
  });

  // A6
  it('should 선택 안내 문구가 표시됨(이전 선택이 해제됨) when 미리보기 후 일반 목록으로 돌아갔다가 휴지통을 다시 연 경우', async () => {
    const user = await openTrash();
    await user.click(screen.getByText('삭제된 노트 C'));
    expect(await screen.findByText('내용 C')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /돌아가기/ }));

    await user.click(await screen.findByRole('button', { name: '휴지통' }));

    expect(await screen.findByText(GUIDE_TEXT)).toBeInTheDocument();
    expect(screen.queryByText('내용 C')).not.toBeInTheDocument();
    expect(isHighlighted('삭제된 노트 C')).toBe(false);
  });

  // A7
  it('should 메인 영역에 선택 안내 문구를 표시 when 휴지통 뷰를 열었고 아직 선택한 노트가 없음', async () => {
    await openTrash();

    expect(screen.getByText(GUIDE_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '노트 제목' })).not.toBeInTheDocument();
  });

  // A8
  it('should 미리보기가 새로 선택한 노트로 교체되고 강조도 옮겨감 when 미리보기 중 다른 휴지통 항목 클릭', async () => {
    const user = await openTrash();
    await user.click(screen.getByText('삭제된 노트 C'));
    expect(await screen.findByText('내용 C')).toBeInTheDocument();

    await user.click(screen.getAllByText('삭제된 노트 D')[0]);

    expect(await screen.findByText('내용 D')).toBeInTheDocument();
    expect(screen.queryByText('내용 C')).not.toBeInTheDocument();
    expect(isHighlighted('삭제된 노트 D')).toBe(true);
    expect(isHighlighted('삭제된 노트 C')).toBe(false);
  });

  // A10
  // 회귀 테스트: 기존 NotePreview의 빈 값 폴백이 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it('should 메인에 "(제목 없음)"과 "(내용 없음)"이 표시되고 에러가 없음 when 제목/내용이 빈 휴지통 노트를 선택', async () => {
    serverNotes = [
      ...serverNotes,
      createTestNote({
        id: 'test-5',
        title: '',
        content: '',
        deletedAt: '2025-01-15T12:00:00.000Z',
      }),
    ];
    const user = await openTrash();
    expect(screen.getAllByText('(제목 없음)')).toHaveLength(1); // 사이드바 항목만

    await user.click(screen.getByText('(제목 없음)'));

    expect(await screen.findByText('(내용 없음)')).toBeInTheDocument();
    expect(screen.getAllByText('(제목 없음)')).toHaveLength(2); // 사이드바 + 메인
    expect(screen.queryByText(GUIDE_TEXT)).not.toBeInTheDocument();
  });

  // A11
  // 회귀 테스트: 기존 handleNewNote의 선택 해제가 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it('should 이전 일반 목록 선택/생성 상태가 에디터에 남지 않음 when 노트 선택 후 휴지통을 열었다가 "+ 새 노트" 클릭', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByText('제목 A'));
    expect(await screen.findByDisplayValue('제목 A')).toBeInTheDocument(); // 일반 노트 편집 중
    await user.click(screen.getByRole('button', { name: '휴지통' }));
    await screen.findByText('삭제된 노트 C');

    await user.click(screen.getByRole('button', { name: '+ 새 노트' }));

    expect(await screen.findByRole('textbox', { name: '노트 제목' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: '노트 내용' })).toHaveValue('');
    expect(screen.queryByDisplayValue('제목 A')).not.toBeInTheDocument();
  });

  // A12
  it('should 메인에 해당 노트의 태그가 삭제 버튼 없이 표시 when 태그가 있는 휴지통 노트를 선택', async () => {
    serverNotes = serverNotes.map((n) =>
      n.id === 'test-3' ? { ...n, tags: ['react', 'design'] } : n,
    );
    const user = await openTrash();

    await user.click(screen.getByText('삭제된 노트 C'));

    expect(await screen.findByText('react')).toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /태그 삭제/ })).not.toBeInTheDocument();
  });

  // A13
  it('should 미리보기의 태그가 새로 선택한 노트의 태그로 교체됨 when 태그가 다른 두 휴지통 노트를 차례로 선택', async () => {
    serverNotes = serverNotes.map((n) => {
      if (n.id === 'test-3') return { ...n, tags: ['react'] };
      if (n.id === 'test-4') return { ...n, tags: ['vue'] };
      return n;
    });
    const user = await openTrash();
    await user.click(screen.getByText('삭제된 노트 C'));
    expect(await screen.findByText('react')).toBeInTheDocument();

    await user.click(screen.getAllByText('삭제된 노트 D')[0]);

    expect(await screen.findByText('vue')).toBeInTheDocument();
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });
});
