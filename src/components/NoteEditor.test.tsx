import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from './NoteEditor';
import { NotesProvider } from '../context/NotesContext';
import * as api from '../api/notes';
import type { Note } from '../types/note';

// 실제 서버(db.json)를 건드리지 않도록 api 모듈 전체를 대체한다.
// 수정 테스트는 아래 테스트 전용 노트(test-*)를 mock 서버 상태로 삼아 진행한다.
vi.mock('../api/notes');

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

// NotesProvider가 초기 노트를 받은 뒤에 노트를 선택해야 폼이 값을 채운다
async function renderEditor(onDone = vi.fn()) {
  const ui = (selectedNoteId: string | null) => (
    <NotesProvider>
      <NoteEditor selectedNoteId={selectedNoteId} isCreating={false} onDone={onDone} />
    </NotesProvider>
  );
  const view = render(ui(null));
  await act(async () => {}); // fetchNotes 응답 반영
  const selectNote = (id: string | null) => view.rerender(ui(id));
  return { selectNote, onDone };
}

async function addTag(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText('태그 입력'), `${text}{Enter}`);
}

describe('NoteEditor 태그', () => {
  let serverNotes: Note[];

  beforeEach(() => {
    vi.clearAllMocks();
    serverNotes = [
      createTestNote({ id: 'test-1', title: '제목 A', content: '내용 A' }),
      createTestNote({
        id: 'test-2',
        title: '제목 B',
        content: '내용 B',
        tags: ['design'],
      }),
      createTestNote({ id: 'test-3', title: '제목 C', content: '내용 C' }), // tags 필드 없음
    ];
    vi.mocked(api.fetchNotes).mockImplementation(async () => serverNotes);
    vi.mocked(api.updateNote).mockImplementation(async (id, updates) => {
      const updated = { ...serverNotes.find((n) => n.id === id)!, ...updates };
      serverNotes = serverNotes.map((n) => (n.id === id ? updated : n));
      return updated;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // E1
  it('should 제목 입력 바로 아래에 "태그 추가" 버튼을 표시 when 기존 노트를 선택', async () => {
    const { selectNote } = await renderEditor();

    selectNote('test-1');

    const titleInput = await screen.findByPlaceholderText('제목');
    const button = screen.getByRole('button', { name: '태그 추가' });
    const textarea = screen.getByPlaceholderText('내용을 입력하세요...');
    expect(
      titleInput.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      button.compareDocumentPosition(textarea) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  // E2
  it('should 태그 입력창을 열고 버튼명을 "닫기"로 바꿈 when "태그 추가"를 클릭', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');

    await user.click(await screen.findByRole('button', { name: '태그 추가' }));

    expect(screen.getByLabelText('태그 입력')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  // E3
  it('should 입력창을 닫고 "태그 추가"로 되돌림 when "닫기"를 클릭', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByLabelText('태그 입력')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '태그 추가' })).toBeInTheDocument();
  });

  // E4
  it('should trim된 태그를 입력 영역 아래에 표시하고 입력창을 비운 채 열어 둠 when 입력창에서 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));

    await addTag(user, '  react  ');

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByLabelText('태그 입력')).toHaveValue('');
  });

  // E5
  it("should 입력한 순서대로 태그를 표시 when 'react', 'design'을 연속 추가", async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));

    await addTag(user, 'react');
    await addTag(user, 'design');

    const react = screen.getByText('react');
    const design = screen.getByText('design');
    expect(react.compareDocumentPosition(design) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // E6
  it('should updateNote를 { title, content, tags }로 호출 when 태그를 추가하고 "저장"을 클릭', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
    await addTag(user, 'react');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.updateNote).toHaveBeenCalledWith('test-1', {
      title: '제목 A',
      content: '내용 A',
      tags: ['react'],
    });
  });

  // E7
  it('should 저장 후 다시 연 노트에 tags를 표시 when 저장이 성공한 뒤 다른 노트를 거쳐 다시 선택', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
    await addTag(user, 'react');
    await user.click(screen.getByRole('button', { name: '저장' }));

    selectNote('test-2');
    await screen.findByDisplayValue('제목 B');
    selectNote('test-1');

    expect(await screen.findByDisplayValue('제목 A')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  // E8
  it('should title, content, tags를 선택한 노트 값으로 리셋하고 이전 노트의 미저장 태그를 섞지 않음 when 다른 노트를 선택', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
    await addTag(user, 'react'); // 저장하지 않은 태그

    selectNote('test-2');

    expect(await screen.findByDisplayValue('제목 B')).toBeInTheDocument();
    expect(screen.getByDisplayValue('내용 B')).toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  // E9
  it('should 입력창을 닫고 입력 중이던 텍스트를 초기화 when 입력창을 열어 둔 채 다른 노트를 선택', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
    await user.type(screen.getByLabelText('태그 입력'), 'typing');

    selectNote('test-2');

    await screen.findByDisplayValue('제목 B');
    expect(screen.queryByLabelText('태그 입력')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '태그 추가' }));
    expect(screen.getByLabelText('태그 입력')).toHaveValue('');
  });

  // E10
  it('should 태그를 추가하지 않고 메시지도 표시하지 않음 when 빈 값이나 공백만 입력하고 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
    const before = document.body.textContent;

    await user.type(screen.getByLabelText('태그 입력'), '   {Enter}');

    expect(document.body.textContent).toBe(before);
    expect(screen.getByLabelText('태그 입력')).toBeInTheDocument();
  });

  // E11
  it('should 태그 목록 영역에 아무것도 표시하지 않음 when 노트에 태그가 없음', async () => {
    const { selectNote } = await renderEditor();

    selectNote('test-1');

    await screen.findByRole('button', { name: '태그 추가' }); // 태그 UI가 렌더된 상태에서
    expect(document.querySelector('.flex-wrap')).toBeNull();
  });

  // E12
  it('should 에러 없이 열리고 태그 목록이 비어 있음 when tags 필드가 없는 기존 노트를 선택', async () => {
    const { selectNote } = await renderEditor();

    selectNote('test-3');

    expect(await screen.findByDisplayValue('제목 C')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '태그 추가' })).toBeInTheDocument();
    expect(document.querySelector('.flex-wrap')).toBeNull();
  });

  // E13
  it('should 에러 없이 저장하고 tags: []로 호출 when tags 필드가 없는 노트의 제목만 수정하고 저장', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-3');
    const title = await screen.findByDisplayValue('제목 C');
    await user.clear(title);
    await user.type(title, '수정된 제목');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.updateNote).toHaveBeenCalledWith('test-3', {
      title: '수정된 제목',
      content: '내용 C',
      tags: [],
    });
  });

  // E16
  // 회귀 테스트: 기존 NoteEditor의 reset 호출이 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it('should 이전 노트의 태그를 지우고 태그 목록 영역을 비움 when 태그가 있는 노트(test-2)에서 tags 필드가 없는 노트(test-3)로 전환', async () => {
    const { selectNote } = await renderEditor();
    selectNote('test-2');
    await screen.findByDisplayValue('제목 B');
    expect(screen.getByText('design')).toBeInTheDocument();

    selectNote('test-3');

    expect(await screen.findByDisplayValue('제목 C')).toBeInTheDocument();
    expect(screen.queryByText('design')).not.toBeInTheDocument();
  });

  // E17
  // 회귀 테스트: 기존 NoteEditor의 reset 호출이 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it('should 이전 노트의 미저장 태그가 남지 않음 when 노트 선택이 해제(selectedNoteId null)된 뒤 다른 노트를 선택', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
    await addTag(user, 'react'); // 저장하지 않은 태그

    selectNote(null);
    expect(screen.getByText('노트를 선택하거나 새 노트를 만드세요')).toBeInTheDocument();
    selectNote('test-3');

    expect(await screen.findByDisplayValue('제목 C')).toBeInTheDocument();
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  // E14
  it('should 편집 중인 tags를 유지하고 onDone을 호출하지 않음 when updateNote가 reject', async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateNote).mockRejectedValue(new Error('Failed to update note'));
    const { selectNote, onDone } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
    await addTag(user, 'react');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  // E15
  it('should updateNote를 호출하지 않음 when 태그를 추가했지만 제목이 비어 있음', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
    await addTag(user, 'react');
    await user.clear(screen.getByPlaceholderText('제목'));

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.updateNote).not.toHaveBeenCalled();
  });
});

describe('NoteEditor 태그 삭제', () => {
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
      createTestNote({ id: 'test-2', title: '제목 B', content: '내용 B' }),
    ];
    vi.mocked(api.fetchNotes).mockImplementation(async () => serverNotes);
    vi.mocked(api.updateNote).mockImplementation(async (id, updates) => {
      const updated = { ...serverNotes.find((n) => n.id === id)!, ...updates };
      serverNotes = serverNotes.map((n) => (n.id === id ? updated : n));
      return updated;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // 이슈 2 E1
  it('should 클릭한 태그가 목록에서 즉시 사라지고 나머지는 남음 when 태그가 있는 노트에서 삭제 버튼을 클릭', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');

    await user.click(await screen.findByRole('button', { name: 'react 태그 삭제' }));

    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
  });

  // 이슈 2 E2
  it('should updateNote를 삭제된 tags를 포함한 { title, content, tags }로 호출 when 태그를 삭제하고 "저장"을 클릭', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: 'react 태그 삭제' }));

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.updateNote).toHaveBeenCalledWith('test-1', {
      title: '제목 A',
      content: '내용 A',
      tags: ['design'],
    });
  });

  // 이슈 2 E3
  it('should 삭제 시점에는 updateNote를 호출하지 않음 when 삭제 버튼만 클릭 (저장 전 서버 미반영)', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');

    await user.click(await screen.findByRole('button', { name: 'react 태그 삭제' }));

    expect(api.updateNote).not.toHaveBeenCalled();
  });

  // 이슈 2 E4
  it('should 삭제가 버려지고 원래 태그가 표시되며 확인창이 뜨지 않음 when 태그를 삭제한 뒤 저장하지 않고 다른 노트로 갔다가 돌아옴', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: 'react 태그 삭제' }));

    selectNote('test-2');
    await screen.findByDisplayValue('제목 B');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    selectNote('test-1');

    expect(await screen.findByDisplayValue('제목 A')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
  });

  // 이슈 2 E5
  it('should 저장한 삭제 결과를 표시 when 저장 후 다른 노트를 거쳐 다시 선택', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: 'react 태그 삭제' }));
    await user.click(screen.getByRole('button', { name: '저장' }));

    selectNote('test-2');
    await screen.findByDisplayValue('제목 B');
    selectNote('test-1');

    expect(await screen.findByDisplayValue('제목 A')).toBeInTheDocument();
    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
  });

  // 이슈 2 E6
  it('should 방금 추가한 태그도 삭제 가능 when 입력창에서 추가한 태그의 삭제 버튼을 클릭', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
    await addTag(user, 'vue');

    await user.click(screen.getByRole('button', { name: 'vue 태그 삭제' }));

    expect(screen.queryByText('vue')).not.toBeInTheDocument();
  });

  // 이슈 2 E7
  it('should 태그 목록 영역에 아무것도 표시하지 않음 when 모든 태그를 삭제', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: 'react 태그 삭제' }));

    await user.click(screen.getByRole('button', { name: 'design 태그 삭제' }));

    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.queryByText('design')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /태그 삭제$/ })).not.toBeInTheDocument();
  });

  // 이슈 2 E8
  it('should tags: []로 updateNote를 호출 when 모든 태그를 삭제하고 저장', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: 'react 태그 삭제' }));
    await user.click(screen.getByRole('button', { name: 'design 태그 삭제' }));

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.updateNote).toHaveBeenCalledWith('test-1', {
      title: '제목 A',
      content: '내용 A',
      tags: [],
    });
  });

  // 이슈 2 E9
  it('should 삭제된 상태의 tags를 유지하고 onDone을 호출하지 않음 when 삭제 후 저장 중 updateNote가 reject', async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateNote).mockRejectedValue(new Error('Failed to update note'));
    const { selectNote, onDone } = await renderEditor();
    selectNote('test-1');
    await user.click(await screen.findByRole('button', { name: 'react 태그 삭제' }));

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onDone).not.toHaveBeenCalled();
    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
  });
});

describe('NoteEditor 중복 태그 (이슈 3)', () => {
  const DUP = '이미 있는 태그입니다';
  let serverNotes: Note[];

  beforeEach(() => {
    vi.clearAllMocks();
    serverNotes = [
      createTestNote({ id: 'test-1', title: '제목 A', content: '내용 A', tags: ['react'] }),
      createTestNote({ id: 'test-2', title: '제목 B', content: '내용 B' }),
    ];
    vi.mocked(api.fetchNotes).mockImplementation(async () => serverNotes);
    vi.mocked(api.updateNote).mockImplementation(async (id, updates) => {
      const updated = { ...serverNotes.find((n) => n.id === id)!, ...updates };
      serverNotes = serverNotes.map((n) => (n.id === id ? updated : n));
      return updated;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  async function openInput(
    user: ReturnType<typeof userEvent.setup>,
    selectNote: (id: string | null) => void,
    id = 'test-1',
  ) {
    selectNote(id);
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
  }

  // 이슈 3 E1
  it('should 태그가 하나만 남고 입력창 아래에 "이미 있는 태그입니다"를 표시 when 이미 있는 태그를 입력하고 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote);

    await addTag(user, 'react');

    expect(screen.getAllByText('react')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(DUP);
  });

  // 이슈 3 E2
  it('should 추가하지 않고 문구를 표시 when 대소문자만 다른 태그를 입력하고 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote);

    await addTag(user, 'React');

    expect(screen.queryByText('React', { selector: 'span' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(DUP);
  });

  // 이슈 3 E3
  it("should 'React'가 유지되고 updateNote가 tags ['React']로 호출 when 'React' 뒤에 'react'를 입력하고 저장", async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-2');
    await addTag(user, 'React');
    await addTag(user, 'react');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.updateNote).toHaveBeenCalledWith('test-2', {
      title: '제목 B',
      content: '내용 B',
      tags: ['React'],
    });
  });

  // 이슈 3 E4
  it('should 문구가 사라지고 태그가 추가됨 when 거절 후 입력값을 수정해 다시 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote);
    await addTag(user, 'react');
    expect(screen.getByRole('alert')).toHaveTextContent(DUP);

    await user.clear(screen.getByLabelText('태그 입력'));
    await addTag(user, 'vue');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('vue')).toBeInTheDocument();
  });

  // 이슈 3 E5
  it('should 입력창 값을 비우지 않음 when 중복으로 거절', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote);

    await addTag(user, 'react');

    expect(screen.getByLabelText('태그 입력')).toHaveValue('react');
  });

  // 이슈 3 E6
  it('should 안내 문구가 사라짐 when 문구가 표시된 상태에서 입력창에 타이핑', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote);
    await addTag(user, 'react');
    expect(screen.getByRole('alert')).toHaveTextContent(DUP);

    await user.type(screen.getByLabelText('태그 입력'), 's');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // 이슈 3 E7
  it('should 안내 문구가 표시되지 않음 when 중복 거절 상태에서 다른 노트를 갔다가 돌아와 입력창을 다시 엶', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote);
    await addTag(user, 'react');
    expect(screen.getByRole('alert')).toHaveTextContent(DUP);

    selectNote('test-2');
    await screen.findByDisplayValue('제목 B');
    selectNote('test-1');
    await screen.findByDisplayValue('제목 A');
    await user.click(screen.getByRole('button', { name: '태그 추가' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // 이슈 3 E8
  it('should 문구가 다시 보임 when 중복 거절 후 입력창을 "닫기"로 닫았다가 다시 엶', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote);
    await addTag(user, 'react');

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '태그 추가' }));

    expect(screen.getByRole('alert')).toHaveTextContent(DUP);
  });
});

describe('NoteEditor 태그 길이/개수 제한 (이슈 4)', () => {
  const LEN_MSG = '태그는 최대 50자까지 입력할 수 있습니다';
  const COUNT_MSG = '태그는 최대 10개까지 추가할 수 있습니다';
  const tagsOf = (count: number) => Array.from({ length: count }, (_, i) => `tag${i}`);
  let serverNotes: Note[];

  beforeEach(() => {
    vi.clearAllMocks();
    serverNotes = [
      createTestNote({ id: 'test-1', title: '제목 A', content: '내용 A', tags: tagsOf(10) }),
      createTestNote({ id: 'test-2', title: '제목 B', content: '내용 B', tags: tagsOf(9) }),
      createTestNote({ id: 'test-3', title: '제목 C', content: '내용 C' }), // tags 필드 없음
    ];
    vi.mocked(api.fetchNotes).mockImplementation(async () => serverNotes);
    vi.mocked(api.updateNote).mockImplementation(async (id, updates) => {
      const updated = { ...serverNotes.find((n) => n.id === id)!, ...updates };
      serverNotes = serverNotes.map((n) => (n.id === id ? updated : n));
      return updated;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  async function openInput(
    user: ReturnType<typeof userEvent.setup>,
    selectNote: (id: string | null) => void,
    id: string,
  ) {
    selectNote(id);
    await user.click(await screen.findByRole('button', { name: '태그 추가' }));
  }

  // 이슈 4 E1
  it('should 태그가 추가되지 않고 입력창 아래에 "태그는 최대 50자까지 입력할 수 있습니다"를 표시 when 51자를 입력하고 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-3');
    const longTag = 'a'.repeat(51);

    await addTag(user, longTag);

    expect(screen.queryByText(longTag)).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(LEN_MSG);
  });

  // 이슈 4 E2
  // 회귀 테스트: 기존 NoteEditor가 50자 태그를 이미 추가한다(제한이 아직 없음). Red 단계에서도 통과한다.
  it('should 태그가 추가되고 안내 문구가 없음 when 50자를 입력하고 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-3');
    const tag = 'a'.repeat(50);

    await addTag(user, tag);

    expect(screen.getByText(tag)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // 이슈 4 E3
  it('should 태그가 추가되지 않고 "태그는 최대 10개까지 추가할 수 있습니다"를 표시 when 태그 10개인 노트에서 입력하고 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-1');

    await addTag(user, 'vue');

    expect(screen.queryByText('vue')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(COUNT_MSG);
  });

  // 이슈 4 E4
  // 회귀 테스트: 기존 NoteEditor가 10번째 태그를 이미 추가한다(제한이 아직 없음). Red 단계에서도 통과한다.
  it('should 10번째 태그가 추가됨 when 태그 9개인 노트에서 입력하고 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-2');

    await addTag(user, 'vue');

    expect(screen.getByText('vue')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // 이슈 4 E5
  it('should 입력창 값을 비우지 않음 when 길이 초과로 거절', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-3');
    const longTag = 'a'.repeat(51);

    await addTag(user, longTag);

    expect(screen.getByLabelText('태그 입력')).toHaveValue(longTag);
  });

  // 이슈 4 E6
  it('should 입력창 값을 비우지 않음 when 개수 초과로 거절', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-1');

    await addTag(user, 'vue');

    expect(screen.getByLabelText('태그 입력')).toHaveValue('vue');
  });

  // 이슈 4 E7
  it('should 안내 문구가 사라짐 when 길이/개수 초과 문구가 표시된 상태에서 입력창에 타이핑', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-1');
    await addTag(user, 'a'.repeat(51));
    expect(screen.getByRole('alert')).toHaveTextContent(LEN_MSG);
    await user.type(screen.getByLabelText('태그 입력'), 's');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('태그 입력'));
    await addTag(user, 'vue');
    expect(screen.getByRole('alert')).toHaveTextContent(COUNT_MSG);
    await user.type(screen.getByLabelText('태그 입력'), 's');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // 이슈 4 E8
  it('should 태그가 추가됨 when 10개 노트에서 태그 하나를 삭제한 뒤 입력하고 Enter', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-1');
    await addTag(user, 'vue');
    expect(screen.queryByText('vue')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'tag0 태그 삭제' }));

    await user.type(screen.getByLabelText('태그 입력'), '{Enter}');

    expect(screen.getByText('vue')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // 이슈 4 E9
  it('should updateNote의 tags에 초과 입력이 포함되지 않음 when 길이 초과로 거절된 뒤 저장', async () => {
    const user = userEvent.setup();
    const { selectNote } = await renderEditor();
    await openInput(user, selectNote, 'test-3');
    await addTag(user, 'a'.repeat(51));
    expect(screen.getByRole('alert')).toHaveTextContent(LEN_MSG);

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.updateNote).toHaveBeenCalledWith('test-3', {
      title: '제목 C',
      content: '내용 C',
      tags: [],
    });
  });
});

describe('NoteEditor 새 노트 태그 (이슈 5)', () => {
  let serverNotes: Note[];

  beforeEach(() => {
    vi.clearAllMocks();
    serverNotes = [
      createTestNote({ id: 'test-1', title: '제목 A', content: '내용 A', tags: ['design'] }),
      createTestNote({ id: 'test-2', title: '제목 B', content: '내용 B' }),
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

  // 새 노트 작성 모드(isCreating)로 전환할 수 있는 렌더 헬퍼
  async function renderCreating(onDone = vi.fn()) {
    const ui = (selectedNoteId: string | null, isCreating: boolean) => (
      <NotesProvider>
        <NoteEditor selectedNoteId={selectedNoteId} isCreating={isCreating} onDone={onDone} />
      </NotesProvider>
    );
    const view = render(ui(null, false));
    await act(async () => {}); // fetchNotes 응답 반영
    const setMode = (selectedNoteId: string | null, isCreating: boolean) =>
      view.rerender(ui(selectedNoteId, isCreating));
    setMode(null, true);
    return { setMode, onDone };
  }

  async function openInput(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: '태그 추가' }));
  }

  // 이슈 5 E1
  it('should "태그 추가" 버튼을 표시 when 새 노트 작성 모드(isCreating)', async () => {
    await renderCreating();

    expect(screen.getByRole('button', { name: '태그 추가' })).toBeInTheDocument();
  });

  // 이슈 5 E2
  it('should 입력창을 열고 버튼명을 "닫기"로 바꿨다가, 다시 "닫기"를 누르면 닫음 when 새 노트 작성 모드에서 "태그 추가"를 클릭', async () => {
    const user = userEvent.setup();
    await renderCreating();

    await openInput(user);
    expect(screen.getByLabelText('태그 입력')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByLabelText('태그 입력')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '태그 추가' })).toBeInTheDocument();
  });

  // 이슈 5 E3
  it('should trim된 태그를 목록에 표시하고 입력창을 비움 when 새 노트 작성 모드에서 입력창에 입력하고 Enter', async () => {
    const user = userEvent.setup();
    await renderCreating();
    await openInput(user);

    await addTag(user, '  react  ');

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByLabelText('태그 입력')).toHaveValue('');
  });

  // 이슈 5 E4
  it('should createNote를 (제목, 내용, [\'react\'])로 호출 when 제목과 내용을 입력하고 태그 react를 추가한 뒤 "저장"', async () => {
    const user = userEvent.setup();
    await renderCreating();
    await user.type(screen.getByPlaceholderText('제목'), '제목');
    await user.type(screen.getByPlaceholderText('내용을 입력하세요...'), '내용');
    await openInput(user);
    await addTag(user, 'react');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.createNote).toHaveBeenCalledWith({
      title: '제목',
      content: '내용',
      tags: ['react'],
    });
  });

  // 이슈 5 E5
  it('should createNote를 (제목, 내용, [])로 호출 when 태그를 추가하지 않고 "저장"', async () => {
    const user = userEvent.setup();
    await renderCreating();
    await user.type(screen.getByPlaceholderText('제목'), '제목');
    await user.type(screen.getByPlaceholderText('내용을 입력하세요...'), '내용');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.createNote).toHaveBeenCalledWith({ title: '제목', content: '내용', tags: [] });
  });

  // 이슈 5 E6
  // 서버 응답의 tags를 입력('react')과 다른 값('server')으로 돌려줘, 노트를 열 때 서버에서 읽은
  // 값을 표시하는지와 작성 중이던 로컬 태그가 남은 것인지를 구분한다.
  it('should 저장한 태그를 표시 when 생성 후 목록에 나타난 새 노트를 선택', async () => {
    const user = userEvent.setup();
    vi.mocked(api.createNote).mockImplementation(async (note) => {
      const created: Note = {
        id: 'test-new',
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        ...note,
        tags: ['server'],
      };
      serverNotes = [...serverNotes, created];
      return created;
    });
    const { setMode } = await renderCreating();
    await user.type(screen.getByPlaceholderText('제목'), '제목');
    await openInput(user);
    await addTag(user, 'react');
    await user.click(screen.getByRole('button', { name: '저장' }));

    setMode('test-new', false);

    expect(await screen.findByDisplayValue('제목')).toBeInTheDocument();
    expect(screen.getByText('server')).toBeInTheDocument();
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  // 이슈 5 E7
  it('should 태그가 추가되지 않고 "이미 있는 태그입니다"를 표시 when 새 노트 작성 모드에서 같은 태그를 두 번 입력', async () => {
    const user = userEvent.setup();
    await renderCreating();
    await openInput(user);
    await addTag(user, 'react');

    await addTag(user, 'react');

    expect(screen.getAllByText('react')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('이미 있는 태그입니다');
  });

  // 이슈 5 E8
  it('should 확인창 없이 작성 중이던 태그가 사라지고 선택한 노트의 저장된 태그만 표시 when 새 노트 작성 중 태그를 추가한 뒤 기존 노트를 선택', async () => {
    const user = userEvent.setup();
    const { setMode } = await renderCreating();
    await openInput(user);
    await addTag(user, 'react');

    setMode('test-1', false);

    expect(await screen.findByDisplayValue('제목 A')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
  });

  // 이슈 5 E9
  it('should 입력창이 닫히고 입력 중이던 텍스트가 초기화 when 새 노트 작성 중 입력창에 타이핑한 뒤 기존 노트를 선택했다가 다시 새 노트를 시작', async () => {
    const user = userEvent.setup();
    const { setMode } = await renderCreating();
    await openInput(user);
    await user.type(screen.getByLabelText('태그 입력'), 'typing');

    setMode('test-1', false);
    await screen.findByDisplayValue('제목 A');
    setMode(null, true);

    expect(screen.queryByLabelText('태그 입력')).not.toBeInTheDocument();
    await openInput(user);
    expect(screen.getByLabelText('태그 입력')).toHaveValue('');
  });

  // 이슈 5 E10
  it('should 안내 문구가 사라짐 when 새 노트 작성 중 안내 문구가 표시된 상태에서 기존 노트를 선택했다가 다시 새 노트를 시작', async () => {
    const user = userEvent.setup();
    const { setMode } = await renderCreating();
    await openInput(user);
    await addTag(user, 'react');
    await addTag(user, 'react');
    expect(screen.getByRole('alert')).toHaveTextContent('이미 있는 태그입니다');

    setMode('test-1', false);
    await screen.findByDisplayValue('제목 A');
    setMode(null, true);
    await openInput(user);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // 이슈 5 E11
  it('should 이전 작성 태그가 남지 않고 태그 목록이 비어 있음 when 새 노트 작성 중 태그를 추가한 뒤 기존 노트를 선택했다가 다시 새 노트를 시작', async () => {
    const user = userEvent.setup();
    const { setMode } = await renderCreating();
    await openInput(user);
    await addTag(user, 'react');

    setMode('test-1', false);
    await screen.findByDisplayValue('제목 A');
    setMode(null, true);

    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.queryByText('design')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /태그 삭제$/ })).not.toBeInTheDocument();
  });

  // 이슈 5 E12
  it('should 태그 없이 시작 when 새 노트를 저장해 작성을 마친 뒤(onDone) 다시 새 노트를 시작', async () => {
    const user = userEvent.setup();
    const { setMode, onDone } = await renderCreating();
    await user.type(screen.getByPlaceholderText('제목'), '제목');
    await openInput(user);
    await addTag(user, 'react');
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(onDone).toHaveBeenCalled();

    setMode(null, false);
    setMode(null, true);

    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  // 이슈 5 E13
  it('should createNote를 호출하지 않음 when 새 노트 작성 중 태그만 추가하고 제목이 비어 있음', async () => {
    const user = userEvent.setup();
    await renderCreating();
    await openInput(user);
    await addTag(user, 'react');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(api.createNote).not.toHaveBeenCalled();
  });

  // 이슈 5 E14
  it('should 작성 중인 tags를 유지하고 onDone을 호출하지 않음 when 새 노트 저장 중 createNote가 reject', async () => {
    const user = userEvent.setup();
    vi.mocked(api.createNote).mockRejectedValue(new Error('Failed to create note'));
    const { onDone } = await renderCreating();
    await user.type(screen.getByPlaceholderText('제목'), '제목');
    await openInput(user);
    await addTag(user, 'react');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByText('react')).toBeInTheDocument();
  });
});
