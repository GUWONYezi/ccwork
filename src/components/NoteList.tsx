import { useNotes } from '../context/NotesContext';
import { useConfirmAction } from '../hooks/useConfirmAction';
import { Confirm } from './Confirm';
import { NoteItem } from './NoteItem';

interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  onTrashed: (id: string) => void;
}

export function NoteList({ selectedNoteId, onSelect, onTrashed }: NoteListProps) {
  const { notes, loading, error, trashNote } = useNotes();

  const trashConfirm = useConfirmAction<string>(async (id) => {
    await trashNote(id);
    onTrashed(id);
  });

  const handleConfirmTrash = async () => {
    try {
      await trashConfirm.confirm();
    } catch (e) {
      console.error('삭제에 실패했습니다', e);
      alert('삭제에 실패했습니다');
    }
  };

  if (loading) {
    return <p className="text-sm text-on-surface-variant text-center py-8">로딩 중...</p>;
  }

  if (error) {
    return <p className="text-sm text-status-error text-center py-8">오류: {error}</p>;
  }

  if (notes.length === 0) {
    return <p className="text-sm text-on-surface-variant text-center py-8">노트가 없습니다</p>;
  }

  return (
    <div className="flex flex-col gap-[1.4rem]">
      <p className="text-xs uppercase tracking-[0.05em] text-on-surface-variant px-1">
        노트 {notes.length}개
      </p>
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          isSelected={note.id === selectedNoteId}
          onSelect={onSelect}
          onDelete={trashConfirm.request}
        />
      ))}

      {/* 삭제 확인 */}
      {trashConfirm.pending !== null && (
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <Confirm title="노트 삭제" onConfirm={handleConfirmTrash} onCancel={trashConfirm.cancel}>
            이 노트를 휴지통으로 옮길까요?
          </Confirm>
        </div>
      )}
    </div>
  );
}
