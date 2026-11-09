import { Note } from '../types/note';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NoteItem({ note, isSelected, onSelect, onDelete }: NoteItemProps) {
  return (
    <div
      onClick={() => onSelect(note.id)}
      className={`rounded-md p-4 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-surface-container-highest'
          : 'bg-surface-container-lowest hover:bg-surface-container'
      }`}
    >
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
      <p className="text-xs text-on-surface-variant mt-[0.7rem] line-clamp-2 leading-relaxed">
        {note.content || '(내용 없음)'}
      </p>
      <p className="text-xs uppercase tracking-[0.05em] text-on-surface-variant mt-[0.7rem]">
        {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
      </p>
    </div>
  );
}
