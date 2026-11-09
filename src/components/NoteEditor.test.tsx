import { render, screen, within } from '@testing-library/react';
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

  describe('저장 흐름', () => {
    async function fillNewNote() {
      await userEvent.type(screen.getByPlaceholderText('제목'), '새 제목');
      await userEvent.type(screen.getByPlaceholderText('내용을 입력하세요...'), '새 내용');
    }

    async function clickSave() {
      await userEvent.click(screen.getByRole('button', { name: '저장' }));
    }

    describe('저장 확인 (Confirm, info)', () => {
      it('저장을 누르면 "저장하시겠습니까?" Confirm이 뜨고, 아직 저장하지 않는다', async () => {
        const { createNote } = setup({ isCreating: true });
        await fillNewNote();

        await clickSave();

        const dialog = screen.getByRole('alertdialog', { name: '저장 확인' });
        expect(dialog).toBeInTheDocument();
        expect(screen.getByText('저장하시겠습니까?')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '저장 확인' }).parentElement).toHaveClass(
          'bg-status-info-container',
        );
        expect(createNote).not.toHaveBeenCalled();
      });

      it('Confirm의 확인 버튼은 info 상태색이다', async () => {
        setup({ isCreating: true });
        await fillNewNote();

        await clickSave();

        const dialog = screen.getByRole('alertdialog');
        expect(within(dialog).getByRole('button', { name: '저장' })).toHaveClass('bg-status-info');
      });

      it('Confirm에서 취소하면 닫히고 저장하지 않으며 입력 내용은 유지된다', async () => {
        const { createNote, onDone } = setup({ isCreating: true });
        await fillNewNote();
        await clickSave();

        await userEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', { name: '취소' }),
        );

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(createNote).not.toHaveBeenCalled();
        expect(onDone).not.toHaveBeenCalled();
        expect(screen.getByPlaceholderText('제목')).toHaveValue('새 제목');
      });
    });

    describe('저장 성공 (Alert, success)', () => {
      it('생성 모드: 확인하면 createNote를 호출하고 성공 Alert를 띄운다', async () => {
        const { createNote } = setup({ isCreating: true });
        await fillNewNote();
        await clickSave();

        await userEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', { name: '저장' }),
        );

        expect(await screen.findByText('성공적으로 저장되었습니다.')).toBeInTheDocument();
        expect(createNote).toHaveBeenCalledWith('새 제목', '새 내용');
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '저장 완료' }).parentElement).toHaveClass(
          'bg-status-success-container',
        );
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });

      it('수정 모드: 확인하면 updateNote(id, { title, content })를 호출한다', async () => {
        const { updateNote } = setup({ selectedNoteId: 'n1' });
        const title = screen.getByPlaceholderText('제목');
        await userEvent.clear(title);
        await userEvent.type(title, '바뀐 제목');
        await clickSave();

        await userEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', { name: '저장' }),
        );

        expect(await screen.findByText('성공적으로 저장되었습니다.')).toBeInTheDocument();
        expect(updateNote).toHaveBeenCalledWith('n1', {
          title: '바뀐 제목',
          content: '기존 내용',
        });
      });

      it('성공 Alert를 닫을 때 onDone을 호출한다 (닫기 전에는 호출하지 않는다)', async () => {
        const { onDone } = setup({ isCreating: true });
        await fillNewNote();
        await clickSave();
        await userEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', { name: '저장' }),
        );
        await screen.findByText('성공적으로 저장되었습니다.');
        expect(onDone).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', { name: '닫기' }));

        expect(onDone).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    describe('저장 실패 (Alert, error)', () => {
      async function failSave() {
        const fns = setup({ isCreating: true });
        fns.createNote.mockRejectedValue(new Error('network'));
        await fillNewNote();
        await clickSave();
        await userEvent.click(
          within(screen.getByRole('alertdialog')).getByRole('button', { name: '저장' }),
        );
        return fns;
      }

      it('"저장에 실패 하였습니다." 오류 Alert를 띄운다', async () => {
        await failSave();

        expect(await screen.findByText('저장에 실패 하였습니다.')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '저장 실패' }).parentElement).toHaveClass(
          'bg-status-error-container',
        );
        expect(screen.queryByText('성공적으로 저장되었습니다.')).not.toBeInTheDocument();
      });

      it('오류 Alert를 닫아도 편집 화면과 입력 내용이 유지되고 onDone은 호출하지 않는다', async () => {
        const { onDone } = await failSave();
        await screen.findByText('저장에 실패 하였습니다.');

        await userEvent.click(screen.getByRole('button', { name: '닫기' }));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(onDone).not.toHaveBeenCalled();
        expect(screen.getByPlaceholderText('제목')).toHaveValue('새 제목');
        expect(screen.getByPlaceholderText('내용을 입력하세요...')).toHaveValue('새 내용');
      });

      it('저장이 끝나면 저장 버튼이 다시 활성화된다', async () => {
        await failSave();
        await screen.findByText('저장에 실패 하였습니다.');

        await userEvent.click(screen.getByRole('button', { name: '닫기' }));

        expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
      });
    });

    describe('변경 없음 (Alert, warning)', () => {
      it('수정 모드에서 바꾼 게 없으면 Confirm 없이 경고 Alert를 띄운다', async () => {
        const { updateNote } = setup({ selectedNoteId: 'n1' });

        await clickSave();

        expect(screen.getByText('변경된 내용이 없습니다.')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '변경 없음' }).parentElement).toHaveClass(
          'bg-status-warning-container',
        );
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(updateNote).not.toHaveBeenCalled();
      });

      it('수정했다가 원래 값으로 되돌려도 변경 없음으로 본다', async () => {
        const { updateNote } = setup({ selectedNoteId: 'n1' });
        const title = screen.getByPlaceholderText('제목');
        await userEvent.clear(title);
        await userEvent.type(title, '임시');
        await userEvent.clear(title);
        await userEvent.type(title, '기존 제목');

        await clickSave();

        expect(screen.getByText('변경된 내용이 없습니다.')).toBeInTheDocument();
        expect(updateNote).not.toHaveBeenCalled();
      });

      it('생성 모드에서 아무것도 입력하지 않으면 경고 Alert를 띄운다', async () => {
        const { createNote } = setup({ isCreating: true });

        await clickSave();

        expect(screen.getByText('변경된 내용이 없습니다.')).toBeInTheDocument();
        expect(createNote).not.toHaveBeenCalled();
      });

      it('경고 Alert를 닫으면 편집 화면에 머문다 (onDone을 호출하지 않는다)', async () => {
        const { onDone } = setup({ selectedNoteId: 'n1' });
        await clickSave();

        await userEvent.click(screen.getByRole('button', { name: '닫기' }));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(onDone).not.toHaveBeenCalled();
        expect(screen.getByPlaceholderText('제목')).toHaveValue('기존 제목');
      });
    });

    it('제목이 비어 있으면 Confirm을 띄우지 않고 저장하지 않는다', async () => {
      const { createNote, onDone } = setup({ isCreating: true });
      await userEvent.type(screen.getByPlaceholderText('내용을 입력하세요...'), '내용만');

      await clickSave();

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(createNote).not.toHaveBeenCalled();
      expect(onDone).not.toHaveBeenCalled();
    });

    it('Confirm/Alert는 화면 전체를 덮는 오버레이 안에 뜬다', async () => {
      setup({ selectedNoteId: 'n1' });

      await clickSave();

      expect(screen.getByRole('alert').closest('.fixed')).toHaveClass('inset-0');
    });
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
