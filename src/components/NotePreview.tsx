import type { ReactElement } from 'react';
import type { Note } from '../types/note';

interface NotePreviewProps {
  note: Note | null; // null이면 "선택 안내" 문구를 표시
}

export function NotePreview({ note }: NotePreviewProps): ReactElement {
  // 선택된 노트가 없는 상태
  if (!note) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant text-sm">노트를 선택하세요</p>
      </div>
    );
  }

  return (
    // min-h: 일반 노트 상세(NoteEditor 카드)와 높이를 맞춘다
    <div className="bg-surface-container-lowest rounded-md px-8 sm:px-12 py-8 max-w-2xl min-h-[40.5rem]">
      {/* 제목 */}
      <h2 className="text-xl font-bold text-on-surface mb-4">{note.title || '(제목 없음)'}</h2>

      {/* 내용 */}
      <p className="text-base text-on-surface-variant leading-relaxed whitespace-pre-wrap">
        {note.content || '(내용 없음)'}
      </p>
    </div>
  );
}
