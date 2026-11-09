import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as api from './api/notes';
import type { Note } from './types/note';

vi.mock('./api/notes', () => ({
  fetchNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

const seed: Note = {
  id: 'n1',
  title: '기존 제목',
  content: '기존 내용',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

async function confirmSave() {
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await userEvent.click(
    within(screen.getByRole('alertdialog', { name: '저장 확인' })).getByRole('button', {
      name: '저장',
    }),
  );
}

describe('App: 노트 저장 흐름', () => {
  beforeEach(() => {
    vi.mocked(api.fetchNotes).mockResolvedValue([seed]);
    vi.mocked(api.createNote).mockReset();
    vi.mocked(api.updateNote).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('새 노트: 저장 확인 → 성공 Alert → 닫으면 편집이 끝나고 목록에 추가된다', async () => {
    vi.mocked(api.createNote).mockResolvedValue({
      ...seed,
      id: 'n2',
      title: '새 제목',
      content: '새 내용',
    });
    render(<App />);
    await screen.findByRole('heading', { name: '기존 제목' });

    await userEvent.click(screen.getByRole('button', { name: '+ 새 노트' }));
    await userEvent.type(screen.getByRole('textbox', { name: '노트 제목' }), '새 제목');
    await userEvent.type(screen.getByRole('textbox', { name: '노트 내용' }), '새 내용');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(screen.getByText('저장하시겠습니까?')).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '저장' }),
    );

    expect(await screen.findByText('성공적으로 저장되었습니다.')).toBeInTheDocument();
    expect(api.createNote).toHaveBeenCalledWith({ title: '새 제목', content: '새 내용' });

    await userEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('노트를 선택하거나 새 노트를 만드세요')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '새 제목' })).toBeInTheDocument();
  });

  it('기존 노트 수정: 저장 성공 후 닫아도 편집 화면이 유지되고 목록이 갱신된다', async () => {
    vi.mocked(api.updateNote).mockResolvedValue({ ...seed, title: '바뀐 제목' });
    render(<App />);
    await userEvent.click(await screen.findByRole('heading', { name: '기존 제목' }));

    const title = screen.getByRole('textbox', { name: '노트 제목' });
    await userEvent.clear(title);
    await userEvent.type(title, '바뀐 제목');
    await confirmSave();

    expect(await screen.findByText('성공적으로 저장되었습니다.')).toBeInTheDocument();
    expect(api.updateNote).toHaveBeenCalledWith('n1', { title: '바뀐 제목', content: '기존 내용' });

    await userEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.getByRole('textbox', { name: '노트 제목' })).toHaveValue('바뀐 제목');
    expect(screen.getByRole('heading', { name: '바뀐 제목' })).toBeInTheDocument();
  });

  it('저장 실패: 오류 Alert가 뜨고, 닫아도 편집 내용이 유지되며 목록은 바뀌지 않는다', async () => {
    vi.mocked(api.updateNote).mockRejectedValue(new Error('Failed to update note'));
    render(<App />);
    await userEvent.click(await screen.findByRole('heading', { name: '기존 제목' }));

    const title = screen.getByRole('textbox', { name: '노트 제목' });
    await userEvent.clear(title);
    await userEvent.type(title, '실패할 제목');
    await confirmSave();

    expect(await screen.findByText('저장에 실패 하였습니다.')).toBeInTheDocument();
    expect(screen.queryByText('성공적으로 저장되었습니다.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.getByRole('textbox', { name: '노트 제목' })).toHaveValue('실패할 제목');
    expect(screen.getByRole('heading', { name: '기존 제목' })).toBeInTheDocument();
  });

  it('변경 없이 저장: 경고 Alert만 뜨고 API는 호출하지 않는다', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('heading', { name: '기존 제목' }));

    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(screen.getByText('변경된 내용이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.updateNote).not.toHaveBeenCalled();
    expect(api.createNote).not.toHaveBeenCalled();
  });

  it('저장 확인에서 취소하면 API를 호출하지 않는다', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('heading', { name: '기존 제목' }));
    await userEvent.type(screen.getByRole('textbox', { name: '노트 내용' }), ' 추가');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '취소' }),
    );

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.updateNote).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: '노트 내용' })).toHaveValue('기존 내용 추가');
  });
});
