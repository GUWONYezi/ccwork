import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteItem } from './NoteItem';
import type { Note } from '../types/note';

function createTestNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'test-1',
    title: '테스트 노트',
    content: '테스트 내용',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderItem(note: Note) {
  return render(<NoteItem note={note} isSelected={false} onSelect={vi.fn()} onDelete={vi.fn()} />);
}

const TAG_COUNT_TEXT = /^태그 \d+$/;

describe('NoteItem 태그 개수 (이슈 6)', () => {
  // 이슈 6 N1
  it('should "태그 3"을 표시 when note.tags가 3개', () => {
    renderItem(createTestNote({ tags: ['react', 'design', 'vue'] }));

    expect(screen.getByText('태그 3')).toBeInTheDocument();
  });

  // 이슈 6 N2
  it('should "태그 1"을 표시 when note.tags가 1개 (표시 기준 1 이상의 하한)', () => {
    renderItem(createTestNote({ tags: ['react'] }));

    expect(screen.getByText('태그 1')).toBeInTheDocument();
  });

  // 이슈 6 N3
  // jsdom은 색을 계산하지 못하므로 클래스 존재로 검증한다.
  it('should 개수 텍스트가 text-on-surface-variant 클래스를 가짐 when note.tags가 있음', () => {
    renderItem(createTestNote({ tags: ['react', 'design', 'vue'] }));

    expect(screen.getByText('태그 3')).toHaveClass('text-on-surface-variant');
  });

  // 이슈 6 N4
  it('should 개수 표시에 아이콘(svg, img)이 없음 when note.tags가 있음', () => {
    renderItem(createTestNote({ tags: ['react', 'design', 'vue'] }));

    const count = screen.getByText('태그 3');
    expect(count.querySelector('svg, img')).toBeNull();
    expect(count.parentElement?.querySelector('svg, img')).toBeNull();
  });

  // 이슈 6 N5
  // 회귀 테스트: 기존 NoteItem이 개수를 아직 표시하지 않아 빈 배열에서도 이미 표시가 없다. Red 단계에서도 통과한다.
  it('should 개수 표시가 없음 when note.tags가 빈 배열', () => {
    renderItem(createTestNote({ tags: [] }));

    expect(screen.queryByText(TAG_COUNT_TEXT)).not.toBeInTheDocument();
  });

  // 이슈 6 N6
  // 회귀 테스트: 기존 NoteItem이 tags 필드 없는 노트를 에러 없이 이미 렌더한다. Red 단계에서도 통과한다.
  it('should 에러 없이 렌더하고 개수 표시가 없음 when tags 필드가 없는 기존 노트', () => {
    expect(() => renderItem(createTestNote())).not.toThrow();

    expect(screen.getByText('테스트 노트')).toBeInTheDocument();
    expect(screen.queryByText(TAG_COUNT_TEXT)).not.toBeInTheDocument();
  });

  // 이슈 6 N7
  it('should "태그 10"을 표시 when note.tags가 10개 (이슈 4의 최대 개수)', () => {
    const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`);

    renderItem(createTestNote({ tags }));

    expect(screen.getByText('태그 10')).toBeInTheDocument();
  });

  // 이슈 6 N8
  // 회귀 테스트: 기존 NoteItem이 제목과 내용을 이미 표시한다. Red 단계에서도 통과한다.
  it('should 제목과 내용을 그대로 표시 when note.tags가 있음 (기존 표시 유지)', () => {
    renderItem(createTestNote({ tags: ['react', 'design'] }));

    expect(screen.getByText('테스트 노트')).toBeInTheDocument();
    expect(screen.getByText('테스트 내용')).toBeInTheDocument();
  });
});
