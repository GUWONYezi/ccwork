import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NoteList } from './NoteList';
import type { Note } from '../types/note';

const useNotesMock = vi.fn();
vi.mock('../context/NotesContext', () => ({
  useNotes: () => useNotesMock(),
}));

const notes: Note[] = [
  {
    id: 'n1',
    title: '첫 노트',
    content: '첫 내용',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'n2',
    title: '둘째 노트',
    content: '둘째 내용',
    createdAt: '2026-11-02T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
  },
];

function mockState(overrides: Record<string, unknown> = {}) {
  const deleteNote = vi.fn().mockResolvedValue(undefined);
  useNotesMock.mockReturnValue({
    notes,
    loading: false,
    error: null,
    deleteNote,
    ...overrides,
  });
  return { deleteNote };
}

describe('NoteList', () => {
  beforeEach(() => {
    useNotesMock.mockReset();
  });

  it('로딩 중이면 "로딩 중..."을 보여준다', () => {
    mockState({ loading: true });
    render(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('오류가 있으면 오류 문구를 보여준다', () => {
    mockState({ error: '서버 오류' });
    render(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);

    expect(screen.getByText('오류: 서버 오류')).toBeInTheDocument();
  });

  it('노트가 없으면 "노트가 없습니다"를 보여준다', () => {
    mockState({ notes: [] });
    render(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);

    expect(screen.getByText('노트가 없습니다')).toBeInTheDocument();
  });

  it('노트 개수와 각 노트를 보여준다', () => {
    mockState();
    render(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);

    expect(screen.getByText('노트 2개')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '첫 노트' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '둘째 노트' })).toBeInTheDocument();
  });

  it('노트를 누르면 onSelect(id)를 호출한다', async () => {
    mockState();
    const onSelect = vi.fn();
    render(<NoteList selectedNoteId={null} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('heading', { name: '둘째 노트' }));

    expect(onSelect).toHaveBeenCalledWith('n2');
  });

  it('삭제 버튼을 누르면 deleteNote(id)를 호출한다', async () => {
    const { deleteNote } = mockState();
    render(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);

    await userEvent.click(screen.getAllByRole('button', { name: '삭제' })[0]);

    expect(deleteNote).toHaveBeenCalledWith('n1');
  });

  describe('디자인 시스템', () => {
    it('기존 토큰(muted-foreground, destructive)을 쓰지 않는다', () => {
      mockState({ error: '서버 오류' });
      const { container, rerender } = render(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);
      const legacy =
        /(?:text|bg|border)-(?:foreground|card|muted|muted-foreground|destructive)(?![\w-])/;

      expect(container.innerHTML).not.toMatch(legacy);

      mockState({ loading: true });
      rerender(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);
      expect(container.innerHTML).not.toMatch(legacy);

      mockState({ notes: [] });
      rerender(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);
      expect(container.innerHTML).not.toMatch(legacy);

      mockState();
      rerender(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);
      expect(container.innerHTML).not.toMatch(legacy);
    });

    it('오류 문구는 status_error 색이고, 안내 문구는 on_surface_variant 색이다', () => {
      mockState({ error: '서버 오류' });
      const { rerender } = render(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);
      expect(screen.getByText('오류: 서버 오류')).toHaveClass('text-status-error');

      mockState({ notes: [] });
      rerender(<NoteList selectedNoteId={null} onSelect={vi.fn()} />);
      expect(screen.getByText('노트가 없습니다')).toHaveClass('text-on-surface-variant');
    });

    it('선택된 노트만 surface_container_highest 배경이다', () => {
      mockState();
      render(<NoteList selectedNoteId="n2" onSelect={vi.fn()} />);

      const cards = screen.getAllByRole('heading').map((h) => h.closest('div[class*="rounded"]'));
      expect(cards[0]).toHaveClass('bg-surface-container-lowest');
      expect(cards[1]).toHaveClass('bg-surface-container-highest');
    });
  });
});
