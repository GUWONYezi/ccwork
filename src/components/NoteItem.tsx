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
      className={`bg-card rounded-2xl p-4 border cursor-pointer transition-all ${
        isSelected
          ? 'border-foreground shadow-[0_2px_12px_rgba(0,0,0,0.12)]'
          : 'border-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1 flex-1">
          {note.title || '(제목 없음)'}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="text-muted-foreground hover:text-destructive text-xs shrink-0 transition-colors cursor-pointer"
        >
          삭제
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
        {note.content || '(내용 없음)'}
      </p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-muted-foreground/70">
          {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
        </p>
        {/* 태그 개수 */}
        {tagCount > 0 && (
          <p className="text-xs uppercase tracking-[0.05em] text-on-surface-variant">
            태그 {tagCount}
          </p>
        )}
      </div>
    </div>
  );
}
