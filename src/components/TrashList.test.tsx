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

    render(
      <TrashList
        notes={notes}
        selectedId={null}
        onSelect={vi.fn()}
        onRestore={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const titles = screen.getAllByText(/삭제$/).map((el) => el.textContent);
    expect(titles).toEqual(['가장 최근 삭제', '그 다음 삭제', '가장 오래전 삭제']);
  });

  it("should 수정일 대신 삭제일(`toLocaleDateString('ko-KR')`)을 표시 when 휴지통 노트가 있음", () => {
    const note = createTrashedNote({
      updatedAt: '2025-01-02T12:00:00.000Z',
      deletedAt: '2025-01-20T12:00:00.000Z',
    });

    render(
      <TrashList
        notes={[note]}
        selectedId={null}
        onSelect={vi.fn()}
        onRestore={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(formatDate(note.deletedAt!))).toBeInTheDocument();
    expect(screen.queryByText(formatDate(note.updatedAt))).not.toBeInTheDocument();
  });

  it('should `onBack`을 호출 when 돌아가기 버튼 클릭', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <TrashList
        notes={[createTrashedNote()]}
        selectedId={null}
        onSelect={vi.fn()}
        onRestore={vi.fn()}
        onBack={onBack}
      />,
    );

    await user.click(screen.getByRole('button', { name: /돌아가기/ }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should 빈 상태 한국어 문구를 표시 when `notes`가 빈 배열', () => {
    render(
      <TrashList
        notes={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onRestore={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('휴지통이 비어 있습니다')).toBeInTheDocument();
  });

  // T1
  it('should onSelect를 해당 id로 호출 when 항목 클릭', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const notes = [
      createTrashedNote({ id: 'test-1', title: '첫째 노트' }),
      createTrashedNote({ id: 'test-2', title: '둘째 노트' }),
    ];
    render(
      <TrashList
        notes={notes}
        selectedId={null}
        onSelect={onSelect}
        onRestore={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByText('둘째 노트'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('test-2');
  });

  // T2
  it('should 해당 항목을 선택 상태로 강조 when selectedId가 노트 id와 일치', () => {
    const notes = [
      createTrashedNote({ id: 'test-1', title: '첫째 노트' }),
      createTrashedNote({ id: 'test-2', title: '둘째 노트' }),
    ];

    render(
      <TrashList
        notes={notes}
        selectedId="test-2"
        onSelect={vi.fn()}
        onRestore={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('둘째 노트').closest('[aria-current="true"]')).not.toBeNull();
    expect(screen.getByText('첫째 노트').closest('[aria-current="true"]')).toBeNull();
  });

  // T3
  it('should 어떤 항목도 강조하지 않음 when selectedId가 null이고, id 지정 후 다시 null로 바뀜', () => {
    const notes = [createTrashedNote({ id: 'test-1', title: '첫째 노트' })];
    const onSelect = vi.fn();
    const onBack = vi.fn();

    // 1. 처음에는 selectedId가 null: 강조 없음
    const { rerender } = render(
      <TrashList
        notes={notes}
        selectedId={null}
        onSelect={onSelect}
        onRestore={vi.fn()}
        onBack={onBack}
      />,
    );
    expect(screen.getByText('첫째 노트')).toBeInTheDocument();
    expect(document.querySelector('[aria-current="true"]')).toBeNull();

    // 2. selectedId를 지정하면 해당 항목이 강조됨
    rerender(
      <TrashList
        notes={notes}
        selectedId="test-1"
        onSelect={onSelect}
        onRestore={vi.fn()}
        onBack={onBack}
      />,
    );
    expect(screen.getByText('첫째 노트').closest('[aria-current="true"]')).not.toBeNull();

    // 3. 다시 null로 돌아오면 어떤 항목도 강조되지 않음
    rerender(
      <TrashList
        notes={notes}
        selectedId={null}
        onSelect={onSelect}
        onRestore={vi.fn()}
        onBack={onBack}
      />,
    );
    expect(document.querySelector('[aria-current="true"]')).toBeNull();
  });

  // T4
  it('should 어떤 항목도 강조하지 않고 에러가 나지 않음 when selectedId가 notes에 없는 id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const notes = [createTrashedNote({ id: 'test-1', title: '첫째 노트' })];

    render(
      <TrashList
        notes={notes}
        selectedId="no-such-id"
        onSelect={onSelect}
        onRestore={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('첫째 노트')).toBeInTheDocument();
    expect(document.querySelector('[aria-current="true"]')).toBeNull();
    // 선택 가능한 항목으로 렌더링되어야 한다(클릭하면 onSelect가 호출됨)
    await user.click(screen.getByText('첫째 노트'));
    expect(onSelect).toHaveBeenCalledWith('test-1');
  });

  // T1
  it('should 각 항목에 "{제목} 복구" 버튼을 표시 when 휴지통 노트가 여러 개', () => {
    const notes = [
      createTrashedNote({ id: 'test-1', title: '첫째 노트' }),
      createTrashedNote({ id: 'test-2', title: '둘째 노트' }),
    ];

    render(
      <TrashList
        notes={notes}
        selectedId={null}
        onSelect={vi.fn()}
        onRestore={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '첫째 노트 복구' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '둘째 노트 복구' })).toBeInTheDocument();
  });

  // T2
  it('should onRestore를 해당 id로 호출 when 항목의 복구 버튼 클릭', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const notes = [
      createTrashedNote({ id: 'test-1', title: '첫째 노트' }),
      createTrashedNote({ id: 'test-2', title: '둘째 노트' }),
    ];
    render(
      <TrashList
        notes={notes}
        selectedId={null}
        onSelect={vi.fn()}
        onRestore={onRestore}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '둘째 노트 복구' }));

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledWith('test-2');
  });

  // T3
  it('should onSelect를 호출하지 않음 when 복구 버튼 클릭', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onRestore = vi.fn();
    render(
      <TrashList
        notes={[createTrashedNote({ id: 'test-1', title: '첫째 노트' })]}
        selectedId={null}
        onSelect={onSelect}
        onRestore={onRestore}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '첫째 노트 복구' }));

    expect(onRestore).toHaveBeenCalledTimes(1); // 복구 버튼이 동작했음을 먼저 확인
    expect(onSelect).not.toHaveBeenCalled();
  });

  // T4
  it('should "(제목 없음) 복구" 버튼을 표시 when 제목이 빈 노트', () => {
    render(
      <TrashList
        notes={[createTrashedNote({ id: 'test-1', title: '' })]}
        selectedId={null}
        onSelect={vi.fn()}
        onRestore={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '(제목 없음) 복구' })).toBeInTheDocument();
  });
});
