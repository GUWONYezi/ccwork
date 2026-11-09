import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NoteEditor } from './NoteEditor';
import type { Note } from '../types/note';

const useNotesMock = vi.fn();
vi.mock('../context/NotesContext', () => ({
  useNotes: () => useNotesMock(),
}));

const note: Note = {
  id: 'n1',
  title: '기존 제목',
  content: '기존 내용',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

function mockNotes() {
  const createNote = vi.fn().mockResolvedValue(undefined);
  const updateNote = vi.fn().mockResolvedValue(undefined);
  useNotesMock.mockReturnValue({ notes: [note], createNote, updateNote });
  return { createNote, updateNote };
}

function setup(props: { selectedNoteId?: string | null; isCreating?: boolean } = {}) {
  const onDone = vi.fn();
  const fns = mockNotes();
  const view = render(
    <NoteEditor
      selectedNoteId={props.selectedNoteId ?? null}
      isCreating={props.isCreating ?? false}
      onDone={onDone}
    />,
  );
  return { onDone, ...fns, ...view };
}

describe('NoteEditor', () => {
  beforeEach(() => {
    useNotesMock.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('선택도 생성도 아니면 안내 문구를 보여준다', () => {
    setup();

    expect(screen.getByText('노트를 선택하거나 새 노트를 만드세요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장' })).not.toBeInTheDocument();
  });

  it('생성 모드에서는 빈 폼과 "새 노트" 라벨을 보여준다', () => {
    setup({ isCreating: true });

    expect(screen.getByText('새 노트')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('제목')).toHaveValue('');
    expect(screen.getByPlaceholderText('내용을 입력하세요...')).toHaveValue('');
  });

  it('선택된 노트가 있으면 제목과 내용을 폼에 채운다', () => {
    setup({ selectedNoteId: 'n1' });

    expect(screen.getByText('노트 편집')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('제목')).toHaveValue('기존 제목');
    expect(screen.getByPlaceholderText('내용을 입력하세요...')).toHaveValue('기존 내용');
  });

  it('생성 모드에서 저장하면 createNote(title, content)를 호출하고 onDone을 호출한다', async () => {
    const { createNote, onDone } = setup({ isCreating: true });

    await userEvent.type(screen.getByPlaceholderText('제목'), '새 제목');
    await userEvent.type(screen.getByPlaceholderText('내용을 입력하세요...'), '새 내용');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(createNote).toHaveBeenCalledWith('새 제목', '새 내용');
  });

  it('수정 모드에서 저장하면 updateNote(id, { title, content })를 호출한다', async () => {
    const { updateNote, onDone } = setup({ selectedNoteId: 'n1' });

    const title = screen.getByPlaceholderText('제목');
    await userEvent.clear(title);
    await userEvent.type(title, '바뀐 제목');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(updateNote).toHaveBeenCalledWith('n1', { title: '바뀐 제목', content: '기존 내용' });
  });

  it('제목이 비어 있으면 저장하지 않는다', async () => {
    const { createNote, onDone } = setup({ isCreating: true });

    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(createNote).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('취소를 누르면 onDone을 호출한다', async () => {
    const { onDone } = setup({ isCreating: true });

    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  describe('디자인 시스템', () => {
    it('구분선(h-px, border-t/b/l/r)과 기존 border 토큰, 검정 기반 그림자를 쓰지 않는다', () => {
      const { container } = setup({ isCreating: true });

      expect(container.innerHTML).not.toMatch(/(?<![\w-])h-px(?![\w-])/);
      expect(container.innerHTML).not.toMatch(/(?<![\w-])border-[btlrxy](?![\w-])/);
      expect(container.innerHTML).not.toMatch(/(?<![\w-])border-border(?![\w-])/);
      expect(container.innerHTML).not.toMatch(/rgba\(0,\s*0,\s*0/);
      expect(container.innerHTML).not.toMatch(/(?<![\w-])shadow-/);
    });

    it('입력창은 Ghost Border이고 포커스 때만 tertiary 테두리가 된다', () => {
      setup({ isCreating: true });

      for (const name of ['노트 제목', '노트 내용']) {
        expect(screen.getByRole('textbox', { name })).toHaveClass(
          'border',
          'border-outline-variant/15',
          'focus:border-tertiary',
          'rounded-md',
        );
      }
    });

    it('기존 토큰(foreground, card, muted, border)을 쓰지 않는다', () => {
      const { container } = setup({ isCreating: true });

      expect(container.innerHTML).not.toMatch(
        /(?:text|bg|border|placeholder:text)-(?:foreground|card|muted|muted-foreground|border)(?![\w-])/,
      );
    });

    it('이모지를 쓰지 않는다 (빈 화면 포함)', () => {
      const { container } = setup();

      expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    });

    it('편집 카드는 surface_container_lowest 배경에 rounded-md이다', () => {
      const { container } = setup({ isCreating: true });

      const card = container.firstElementChild as HTMLElement;
      expect(card).toHaveClass('bg-surface-container-lowest', 'rounded-md');
      expect(card).not.toHaveClass('rounded-3xl');
    });

    it('저장은 Primary 그라데이션, 취소는 Secondary 스타일이다', () => {
      setup({ isCreating: true });

      expect(screen.getByRole('button', { name: '저장' })).toHaveClass(
        'bg-linear-to-br',
        'from-tertiary',
        'to-tertiary-container',
        'text-on-tertiary',
        'rounded-md',
      );
      expect(screen.getByRole('button', { name: '취소' })).toHaveClass(
        'bg-surface-container-high',
        'text-on-surface',
        'rounded-md',
      );
    });
  });

  describe('접근성', () => {
    it('제목 입력과 내용 입력에 aria-label이 있다', () => {
      setup({ isCreating: true });

      expect(screen.getByRole('textbox', { name: '노트 제목' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: '노트 내용' })).toBeInTheDocument();
    });
  });
});
