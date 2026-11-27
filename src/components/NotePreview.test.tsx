import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotePreview } from './NotePreview';
import type { Note } from '../types/note';

function createTrashedNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'test-1',
    title: '삭제된 노트',
    content: '삭제된 노트의 내용',
    createdAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-02T12:00:00.000Z',
    deletedAt: '2025-01-20T12:00:00.000Z',
    ...overrides,
  };
}

const GUIDE_TEXT = '노트를 선택하세요';

describe('NotePreview', () => {
  // P1
  it('should 제목과 내용을 표시 when note가 주어짐', () => {
    render(<NotePreview note={createTrashedNote()} />);

    expect(screen.getByText('삭제된 노트')).toBeInTheDocument();
    expect(screen.getByText('삭제된 노트의 내용')).toBeInTheDocument();
  });

  // P2
  it('should 입력창/저장 버튼 없이 읽기 전용으로 렌더링 when note가 주어짐', () => {
    render(<NotePreview note={createTrashedNote()} />);

    expect(screen.getByText('삭제된 노트')).toBeInTheDocument(); // 렌더링되었음을 먼저 확인
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // P3
  it('should "(제목 없음)"을 표시 when title이 빈 문자열', () => {
    render(<NotePreview note={createTrashedNote({ title: '' })} />);

    expect(screen.getByText('(제목 없음)')).toBeInTheDocument();
  });

  // P4
  it('should "(내용 없음)"을 표시 when content가 빈 문자열', () => {
    render(<NotePreview note={createTrashedNote({ content: '' })} />);

    expect(screen.getByText('(내용 없음)')).toBeInTheDocument();
  });

  // P5
  it('should 선택 안내 문구를 표시하고 제목/내용 영역은 없음 when note가 null', () => {
    render(<NotePreview note={null} />);

    expect(screen.getByText(GUIDE_TEXT)).toBeInTheDocument();
    expect(screen.queryByText('(제목 없음)')).not.toBeInTheDocument();
    expect(screen.queryByText('(내용 없음)')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  // P6
  it('should 태그를 제목과 내용 사이에 표시 when note에 tags가 있음', () => {
    render(<NotePreview note={createTrashedNote({ tags: ['react', 'design'] })} />);

    const title = screen.getByText('삭제된 노트');
    const content = screen.getByText('삭제된 노트의 내용');
    for (const label of ['react', 'design']) {
      const tag = screen.getByText(label);
      expect(title.compareDocumentPosition(tag) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(tag.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  // P7
  it('should 태그에 삭제 버튼이 없음 when note에 tags가 있음', () => {
    render(<NotePreview note={createTrashedNote({ tags: ['react', 'design'] })} />);

    expect(screen.getByText('react')).toBeInTheDocument(); // 태그가 렌더링되었음을 먼저 확인
    expect(screen.queryAllByRole('button', { name: /태그 삭제/ })).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  // P8
  // 회귀 테스트: 기존 NotePreview가 태그를 그리지 않아 Red 단계에서도 통과한다. (구현 후에는 tags 없음 처리를 검증)
  it('should 태그 영역을 렌더링하지 않고 에러가 없음 when tags 필드가 없는 노트', () => {
    const note = createTrashedNote();
    delete note.tags;

    const { container } = render(<NotePreview note={note} />);

    expect(screen.getByText('삭제된 노트')).toBeInTheDocument();
    expect(container.querySelector('.flex-wrap')).toBeNull();
  });

  // P9
  // 회귀 테스트: 기존 NotePreview가 태그를 그리지 않아 Red 단계에서도 통과한다. (구현 후에는 빈 배열 처리를 검증)
  it('should 태그 영역을 렌더링하지 않음 when tags가 빈 배열', () => {
    const { container } = render(<NotePreview note={createTrashedNote({ tags: [] })} />);

    expect(screen.getByText('삭제된 노트')).toBeInTheDocument();
    expect(container.querySelector('.flex-wrap')).toBeNull();
  });
});
