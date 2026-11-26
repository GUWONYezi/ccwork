import { describe, expect, it } from 'vitest';
import { partitionNotes, sortByDeletedAt } from './trash';
import type { Note } from '../types/note';

function createTestNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'test-1',
    title: '테스트 노트',
    content: '내용',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('partitionNotes', () => {
  it('should `activeNotes`에는 deletedAt이 없는 노트를, `trashedNotes`에는 deletedAt이 있는 노트를 담아 반환 when 두 종류가 섞인 배열', () => {
    const active = createTestNote({ id: 'test-1' });
    const trashed = createTestNote({ id: 'test-2', deletedAt: '2025-01-10T12:00:00.000Z' });

    const result = partitionNotes([active, trashed]);

    expect(result.activeNotes).toEqual([active]);
    expect(result.trashedNotes).toEqual([trashed]);
  });

  it('should 각 그룹에서 입력 순서를 유지 when 여러 노트가 섞여 있음', () => {
    const a1 = createTestNote({ id: 'test-a1' });
    const t1 = createTestNote({ id: 'test-t1', deletedAt: '2025-01-10T12:00:00.000Z' });
    const a2 = createTestNote({ id: 'test-a2' });
    const t2 = createTestNote({ id: 'test-t2', deletedAt: '2025-01-05T12:00:00.000Z' });

    const result = partitionNotes([a1, t1, a2, t2]);

    expect(result.activeNotes.map((n) => n.id)).toEqual(['test-a1', 'test-a2']);
    expect(result.trashedNotes.map((n) => n.id)).toEqual(['test-t1', 'test-t2']);
  });

  it('should 해당 노트를 `activeNotes`에 포함 when `deletedAt` 필드가 없는 기존 노트', () => {
    const legacy = createTestNote({ id: 'test-legacy' });

    const result = partitionNotes([legacy]);

    expect(result.activeNotes).toEqual([legacy]);
    expect(result.trashedNotes).toEqual([]);
  });

  it('should 해당 노트를 `activeNotes`에 포함 when `deletedAt`이 `null`', () => {
    const restored = createTestNote({ id: 'test-null', deletedAt: null });

    const result = partitionNotes([restored]);

    expect(result.activeNotes).toEqual([restored]);
    expect(result.trashedNotes).toEqual([]);
  });

  it('should 두 그룹 모두 빈 배열을 반환 when 빈 배열 입력', () => {
    const result = partitionNotes([]);

    expect(result).toEqual({ activeNotes: [], trashedNotes: [] });
  });

  it('should 입력 배열과 노트 객체를 변경하지 않음 when 호출 후', () => {
    const input = [
      createTestNote({ id: 'test-1' }),
      createTestNote({ id: 'test-2', deletedAt: '2025-01-10T12:00:00.000Z' }),
    ];
    const snapshot = JSON.parse(JSON.stringify(input));

    partitionNotes(input);

    expect(input).toEqual(snapshot);
    expect(input).toHaveLength(2);
  });
});

describe('sortByDeletedAt', () => {
  it('should 최근 삭제 순(deletedAt 내림차순)으로 정렬해 반환 when deletedAt이 서로 다른 노트 여러 개', () => {
    const old = createTestNote({ id: 'test-old', deletedAt: '2025-01-01T12:00:00.000Z' });
    const recent = createTestNote({ id: 'test-recent', deletedAt: '2025-01-20T12:00:00.000Z' });
    const middle = createTestNote({ id: 'test-middle', deletedAt: '2025-01-10T12:00:00.000Z' });

    const result = sortByDeletedAt([old, recent, middle]);

    expect(result.map((n) => n.id)).toEqual(['test-recent', 'test-middle', 'test-old']);
  });

  it('should 빈 배열을 반환 when 빈 배열 입력', () => {
    expect(sortByDeletedAt([])).toEqual([]);
  });

  it('should 입력 배열의 순서를 바꾸지 않고 새 배열을 반환 when 호출 후', () => {
    const old = createTestNote({ id: 'test-old', deletedAt: '2025-01-01T12:00:00.000Z' });
    const recent = createTestNote({ id: 'test-recent', deletedAt: '2025-01-20T12:00:00.000Z' });
    const input = [old, recent];

    const result = sortByDeletedAt(input);

    expect(result).not.toBe(input);
    expect(input.map((n) => n.id)).toEqual(['test-old', 'test-recent']);
  });
});
