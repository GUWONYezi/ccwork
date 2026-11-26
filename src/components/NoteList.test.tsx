import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteList } from './NoteList';
import { NotesProvider } from '../context/NotesContext';
import * as api from '../api/notes';
import type { Note } from '../types/note';

// 실제 서버(db.json)를 건드리지 않도록 api 모듈 전체를 대체한다
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

const notes = [
  createTestNote({ id: 'test-1', title: '제목 A' }),
  createTestNote({ id: 'test-2', title: '제목 B' }),
];

async function setup() {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  const onTrashed = vi.fn();
  render(
    <NotesProvider>
      <NoteList selectedNoteId={null} onSelect={onSelect} onTrashed={onTrashed} />
    </NotesProvider>,
  );
  await screen.findByText('제목 A');
  return { user, onTrashed };
}

// 첫 번째 노트(제목 A)의 삭제 버튼
const firstDeleteButton = () => screen.getAllByRole('button', { name: '삭제' })[0];

describe('NoteList 삭제 (Trash 이슈 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchNotes).mockResolvedValue(notes);
    vi.mocked(api.updateNote).mockImplementation(async (id, updates) => ({
      ...notes.find((n) => n.id === id)!,
      ...updates,
    }));
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('should `Confirm`을 표시하고 노트는 그대로 둠 when 삭제 버튼 클릭', async () => {
    const { user } = await setup();

    await user.click(firstDeleteButton());

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('제목 A')).toBeInTheDocument();
    expect(api.updateNote).not.toHaveBeenCalled();
    expect(api.deleteNote).not.toHaveBeenCalled();
  });

  it('should `trashNote`를 해당 id로 호출 when `Confirm`에서 확인 클릭', async () => {
    const { user } = await setup();
    await user.click(firstDeleteButton());

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(api.updateNote).toHaveBeenCalledTimes(1);
    expect(api.updateNote).toHaveBeenCalledWith(
      'test-1',
      expect.objectContaining({ deletedAt: expect.any(String) }),
    );
    expect(api.deleteNote).not.toHaveBeenCalled();
  });

  it('should 서버 호출 없이 `Confirm`을 닫고 노트가 남음 when `Confirm`에서 취소 클릭', async () => {
    const { user } = await setup();
    await user.click(firstDeleteButton());

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText('제목 A')).toBeInTheDocument();
    expect(api.updateNote).not.toHaveBeenCalled();
    expect(api.deleteNote).not.toHaveBeenCalled();
  });

  it('should 서버 호출 없이 `Confirm`을 닫음 when `Confirm`의 닫기(×) 클릭', async () => {
    const { user } = await setup();
    await user.click(firstDeleteButton());

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.updateNote).not.toHaveBeenCalled();
    expect(api.deleteNote).not.toHaveBeenCalled();
  });

  it('should `onTrashed(id)`를 호출 when 삭제가 성공', async () => {
    const { user, onTrashed } = await setup();
    await user.click(firstDeleteButton());

    await user.click(screen.getByRole('button', { name: '확인' }));

    await vi.waitFor(() => expect(onTrashed).toHaveBeenCalledWith('test-1'));
  });

  it('should `alert`로 실패를 알리고 노트가 일반 목록에 남음 when `trashNote`가 reject', async () => {
    vi.mocked(api.updateNote).mockRejectedValue(new Error('Failed to update note'));
    const { user } = await setup();
    await user.click(firstDeleteButton());

    await user.click(screen.getByRole('button', { name: '확인' }));

    await vi.waitFor(() => expect(window.alert).toHaveBeenCalledTimes(1));
    expect(screen.getByText('제목 A')).toBeInTheDocument();
  });

  it('should `onTrashed`를 호출하지 않음 when `trashNote`가 reject', async () => {
    vi.mocked(api.updateNote).mockRejectedValue(new Error('Failed to update note'));
    const { user, onTrashed } = await setup();
    await user.click(firstDeleteButton());

    await user.click(screen.getByRole('button', { name: '확인' }));

    await vi.waitFor(() => expect(window.alert).toHaveBeenCalledTimes(1));
    expect(onTrashed).not.toHaveBeenCalled();
  });
});

describe('NoteList 삭제 경계 (Trash 이슈 1, 추가 시나리오)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchNotes).mockResolvedValue(notes);
    vi.mocked(api.updateNote).mockImplementation(async (id, updates) => ({
      ...notes.find((n) => n.id === id)!,
      ...updates,
    }));
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  // 회귀 테스트: 기존 NoteList의 빈 목록 분기가 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it('should 빈 목록 문구가 표시되고 에러가 나지 않음 when 유일한 노트를 삭제 확인', async () => {
    vi.mocked(api.fetchNotes).mockResolvedValue([notes[0]]);
    const { user } = await setup();
    await user.click(firstDeleteButton());

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('노트가 없습니다')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('should updateNote를 한 번만 호출 when 확인 버튼을 연속으로 두 번 클릭', async () => {
    // 서버 응답을 늦춰 첫 요청이 끝나기 전에 두 번째 클릭이 들어오는 상황을 만든다
    const resolvers: Array<() => void> = [];
    vi.mocked(api.updateNote).mockImplementation(
      (id, updates) =>
        new Promise((resolve) => {
          resolvers.push(() => resolve({ ...notes.find((n) => n.id === id)!, ...updates }));
        }),
    );
    const { user } = await setup();
    await user.click(firstDeleteButton());
    const confirmButton = screen.getByRole('button', { name: '확인' });

    await user.dblClick(confirmButton);

    expect(api.updateNote).toHaveBeenCalledTimes(1);
    resolvers.forEach((resolve) => resolve());
  });
});
