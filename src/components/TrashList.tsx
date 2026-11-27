import { Note } from '../types/note';

interface TrashListProps {
  notes: Note[]; // 이미 정렬된 휴지통 노트
  selectedId: string | null; // 선택된 항목 강조용
  onSelect: (id: string) => void; // 항목 클릭 시 호출
  onBack: () => void;
}

export function TrashList({ notes, selectedId, onSelect, onBack }: TrashListProps) {
  return (
    <div className="flex flex-col gap-[1.4rem]">
      {/* 돌아가기 */}
      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-md px-3 py-1.5 text-sm text-tertiary hover:bg-tertiary/2 cursor-pointer"
      >
        목록으로 돌아가기
      </button>

      {/* 빈 상태 */}
      {notes.length === 0 && (
        <p className="text-sm text-on-surface-variant text-center py-8">휴지통이 비어 있습니다</p>
      )}

      {/* 휴지통 노트 */}
      {notes.map((note) => (
        <div
          key={note.id}
          onClick={() => onSelect(note.id)}
          aria-current={note.id === selectedId ? 'true' : undefined}
          className={`rounded-md p-4 cursor-pointer transition-colors ${
            note.id === selectedId
              ? 'bg-surface-container-highest'
              : 'bg-surface-container-lowest hover:bg-surface'
          }`}
        >
          <h3 className="font-semibold text-sm text-on-surface line-clamp-1">
            {note.title || '(제목 없음)'}
          </h3>
          <p className="text-xs uppercase tracking-[0.05em] text-on-surface-variant mt-2">
            {note.deletedAt ? new Date(note.deletedAt).toLocaleDateString('ko-KR') : ''}
          </p>
        </div>
      ))}
    </div>
  );
}
