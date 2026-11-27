import { Note } from '../types/note';

interface TrashListProps {
  notes: Note[]; // 이미 정렬된 휴지통 노트
  selectedId: string | null; // 선택된 항목 강조용
  onSelect: (id: string) => void; // 항목 클릭 시 호출
  onRestore: (id: string) => void; // 복구 버튼 클릭 시 호출 (복구 Confirm 요청)
  onBack: () => void;
}

export function TrashList({ notes, selectedId, onSelect, onRestore, onBack }: TrashListProps) {
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
      {notes.map((note) => {
        const isSelected = note.id === selectedId;

        return (
          <div
            key={note.id}
            onClick={() => onSelect(note.id)}
            aria-current={isSelected ? 'true' : undefined}
            className={`rounded-md p-4 cursor-pointer transition-colors ${
              isSelected
                ? 'bg-surface-container-highest'
                : 'bg-surface-container-lowest hover:bg-surface'
            }`}
          >
            {/* 제목 줄 */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-on-surface line-clamp-1 flex-1">
                {note.title || '(제목 없음)'}
              </h3>
              <button
                type="button"
                aria-label={`${note.title || '(제목 없음)'} 복구`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(note.id);
                }}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-tertiary hover:bg-tertiary/2 cursor-pointer"
              >
                복구
              </button>
            </div>
            <p className="text-xs uppercase tracking-[0.05em] text-on-surface-variant mt-2">
              {note.deletedAt ? new Date(note.deletedAt).toLocaleDateString('ko-KR') : ''}
            </p>
          </div>
        );
      })}
    </div>
  );
}
