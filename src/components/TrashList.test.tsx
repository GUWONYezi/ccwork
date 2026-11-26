import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrashList } from './TrashList';
import type { Note } from '../types/note';

function createTrashedNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'test-1',
    title: '삭제된 노트',
    content: '내용',
    createdAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-02T12:00:00.000Z',
    deletedAt: '2025-01-20T12:00:00.000Z',
    ...overrides,
  };
}

// 날짜 경계에서 먼 정오 UTC 값을 쓰고, 기대값은 같은 방식으로 계산해 타임존 영향을 없앤다
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

describe('TrashList', () => {
  it('should 삭제된 노트를 전달받은 순서(최근 삭제 순)대로 표시 when 휴지통 노트가 여러 개', () => {
    const notes = [
      createTrashedNote({
        id: 'test-1',
        title: '가장 최근 삭제',
        deletedAt: '2025-01-20T12:00:00.000Z',
      }),
      createTrashedNote({
        id: 'test-2',
        title: '그 다음 삭제',
        deletedAt: '2025-01-10T12:00:00.000Z',
      }),
      createTrashedNote({
        id: 'test-3',
        title: '가장 오래전 삭제',
        deletedAt: '2025-01-05T12:00:00.000Z',
      }),
    ];

    render(<TrashList notes={notes} onBack={vi.fn()} />);

    const titles = screen.getAllByText(/삭제$/).map((el) => el.textContent);
    expect(titles).toEqual(['가장 최근 삭제', '그 다음 삭제', '가장 오래전 삭제']);
  });

  it("should 수정일 대신 삭제일(`toLocaleDateString('ko-KR')`)을 표시 when 휴지통 노트가 있음", () => {
    const note = createTrashedNote({
      updatedAt: '2025-01-02T12:00:00.000Z',
      deletedAt: '2025-01-20T12:00:00.000Z',
    });

    render(<TrashList notes={[note]} onBack={vi.fn()} />);

    expect(screen.getByText(formatDate(note.deletedAt!))).toBeInTheDocument();
    expect(screen.queryByText(formatDate(note.updatedAt))).not.toBeInTheDocument();
  });

  it('should `onBack`을 호출 when 돌아가기 버튼 클릭', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<TrashList notes={[createTrashedNote()]} onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /돌아가기/ }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should 빈 상태 한국어 문구를 표시 when `notes`가 빈 배열', () => {
    render(<TrashList notes={[]} onBack={vi.fn()} />);

    expect(screen.getByText('휴지통이 비어 있습니다')).toBeInTheDocument();
  });
});
