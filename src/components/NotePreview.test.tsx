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
});
