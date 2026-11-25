import { Note } from '../types/note';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NoteItem({ note, isSelected, onSelect, onDelete }: NoteItemProps) {
  const tagCount = (note.tags ?? []).length;

  return (
    <div
      onClick={() => onSelect(note.id)}
      className={`rounded-md p-4 cursor-pointer transition-colors ${
        isSelected ? 'bg-surface-container-highest' : 'bg-surface-container-lowest hover:bg-surface'
      }`}
    >
      {/* 제목 줄 */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm text-on-surface line-clamp-1 flex-1">
          {note.title || '(제목 없음)'}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="text-on-surface-variant hover:text-status-error text-xs shrink-0 transition-colors cursor-pointer"
        >
          삭제
        </button>
      </div>
      {/* 내용 */}
      <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
        {note.content || '(내용 없음)'}
      </p>
      {/* 날짜와 태그 개수 */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs uppercase tracking-[0.05em] text-on-surface-variant">
          {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
        </p>
        {tagCount > 0 && (
          <p className="text-xs uppercase tracking-[0.05em] text-on-surface-variant">
            태그 {tagCount}
          </p>
        )}
      </div>
    </div>
  );
}
