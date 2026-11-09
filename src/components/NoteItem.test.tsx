import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NoteItem } from './NoteItem';
import type { Note } from '../types/note';

const note: Note = {
  id: 'n1',
  title: '첫 노트',
  content: '본문 내용',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-09T00:00:00.000Z',
};

function setup(overrides: Partial<Note> = {}, isSelected = false) {
  const onSelect = vi.fn();
  const onDelete = vi.fn();
  const view = render(
    <NoteItem
      note={{ ...note, ...overrides }}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    />,
  );
  // 카드 루트 요소 (클릭 대상)
  const card = view.container.firstElementChild as HTMLElement;
  return { onSelect, onDelete, card, ...view };
}

describe('NoteItem', () => {
  it('제목, 내용, 수정일(ko-KR)을 보여준다', () => {
    setup();

    expect(screen.getByRole('heading', { name: '첫 노트' })).toBeInTheDocument();
    expect(screen.getByText('본문 내용')).toBeInTheDocument();
    expect(
      screen.getByText(new Date(note.updatedAt).toLocaleDateString('ko-KR')),
    ).toBeInTheDocument();
  });

  it('제목과 내용이 비어 있으면 대체 문구를 보여준다', () => {
    setup({ title: '', content: '' });

    expect(screen.getByText('(제목 없음)')).toBeInTheDocument();
    expect(screen.getByText('(내용 없음)')).toBeInTheDocument();
  });

  it('카드를 누르면 onSelect(id)를 호출한다', async () => {
    const { onSelect, card } = setup();

    await userEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith('n1');
  });

  it('삭제 버튼은 onDelete(id)만 호출하고 onSelect는 호출하지 않는다', async () => {
    const { onSelect, onDelete } = setup();

    await userEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(onDelete).toHaveBeenCalledWith('n1');
    expect(onSelect).not.toHaveBeenCalled();
  });

  describe('디자인 시스템', () => {
    it('테두리와 검정 기반 그림자를 쓰지 않는다', () => {
      const { container } = setup();

      expect(container.innerHTML).not.toMatch(/(?<![\w-])border(?:-[\w/[\]-]+)?(?![\w-])/);
      expect(container.innerHTML).not.toMatch(/rgba\(0,\s*0,\s*0/);
      expect(container.innerHTML).not.toMatch(/(?<![\w-])shadow-/);
    });

    it('기존 토큰(foreground, card, muted, destructive)을 쓰지 않는다', () => {
      const { container } = setup();

      expect(container.innerHTML).not.toMatch(
        /(?:text|bg|border)-(?:foreground|card|muted|muted-foreground|destructive|border)(?![\w-])/,
      );
    });

    it('기본 카드는 흰색(surface_container_lowest)이고 hover 때 surface_container가 된다', () => {
      const { card } = setup();

      expect(card).toHaveClass('bg-surface-container-lowest', 'hover:bg-surface-container');
      expect(card).toHaveClass('rounded-md');
    });

    it('선택된 카드는 surface_container_highest 배경이다', () => {
      const { card } = setup({}, true);

      expect(card).toHaveClass('bg-surface-container-highest');
      expect(card).not.toHaveClass('bg-surface-container-lowest');
    });

    it('제목은 on_surface, 내용은 on_surface_variant, 삭제 hover는 status_error이다', () => {
      setup();

      expect(screen.getByRole('heading', { name: '첫 노트' })).toHaveClass('text-on-surface');
      expect(screen.getByText('본문 내용')).toHaveClass('text-on-surface-variant');
      expect(screen.getByRole('button', { name: '삭제' })).toHaveClass('hover:text-status-error');
    });
  });
});
