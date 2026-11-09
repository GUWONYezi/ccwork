import { useState, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import { Alert } from './Alert';
import { Confirm } from './Confirm';
import { DialogOverlay } from './DialogOverlay';
import type { AlertVariant } from './statusStyles';

interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}

// 화면에 띄우는 대화상자 상태: 저장 확인(Confirm) 또는 결과 안내(Alert)
type DialogState =
  | { type: 'confirm' }
  | {
      type: 'alert';
      variant: AlertVariant;
      title: string;
      message: string;
      onClose?: () => void;
    };

export function NoteEditor({ selectedNoteId, isCreating, onDone }: NoteEditorProps) {
  const { notes, createNote, updateNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // 선택된 노트가 바뀔 때 폼 동기화
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
    } else if (isCreating) {
      setTitle('');
      setContent('');
    }
  }, [selectedNoteId, isCreating]); // eslint-disable-line react-hooks/exhaustive-deps

  // 수정 모드는 원본 노트와 비교하고, 생성 모드는 입력이 있는지로 변경 여부를 판단
  const original = isCreating ? undefined : selectedNote;
  const hasChanges = original
    ? title !== original.title || content !== original.content
    : title !== '' || content !== '';

  const handleSave = () => {
    if (!hasChanges) {
      setDialog({
        type: 'alert',
        variant: 'warning',
        title: '변경 없음',
        message: '변경된 내용이 없습니다.',
      });
      return;
    }

    if (!title.trim()) {
      console.error('제목을 입력해주세요');
      return;
    }

    setDialog({ type: 'confirm' });
  };

  const handleConfirmSave = async () => {
    setDialog(null);
    setSaving(true);
    try {
      if (isCreating) {
        await createNote(title, content);
      } else if (selectedNoteId) {
        await updateNote(selectedNoteId, { title, content });
      }
      // 성공 안내를 닫을 때 편집을 마친다 (먼저 마치면 Alert가 함께 사라진다)
      setDialog({
        type: 'alert',
        variant: 'success',
        title: '저장 완료',
        message: '성공적으로 저장되었습니다.',
        onClose: onDone,
      });
    } catch (e) {
      console.error('저장에 실패했습니다', e);
      setDialog({
        type: 'alert',
        variant: 'error',
        title: '저장 실패',
        message: '저장에 실패 하였습니다.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAlert = () => {
    const onClose = dialog?.type === 'alert' ? dialog.onClose : undefined;
    setDialog(null);
    onClose?.();
  };

  // 아무것도 선택 안 된 상태
  if (!isCreating && !selectedNoteId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant text-sm">노트를 선택하거나 새 노트를 만드세요</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface-container-lowest rounded-md px-8 sm:px-12 py-8 max-w-2xl">
        {/* 섹션 라벨 */}
        <p className="text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-6">
          {isCreating ? '새 노트' : '노트 편집'}
        </p>

        {/* 제목 입력 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          aria-label="노트 제목"
          className="w-full rounded-md border border-outline-variant/15 bg-surface-container-lowest px-3 py-2 text-xl font-bold text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-tertiary mb-[1.4rem]"
        />

        {/* 내용 입력 */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요..."
          aria-label="노트 내용"
          rows={14}
          className="w-full resize-none rounded-md border border-outline-variant/15 bg-surface-container-lowest px-3 py-2 text-base leading-relaxed text-on-surface-variant outline-none placeholder:text-on-surface-variant/50 focus:border-tertiary"
        />

        {/* 버튼 영역 */}
        <div className="flex gap-3 mt-[1.4rem]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-linear-to-br from-tertiary to-tertiary-container px-5 py-2 text-sm font-semibold text-on-tertiary transition-opacity hover:opacity-75 disabled:opacity-40 cursor-pointer"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={onDone}
            className="rounded-md bg-surface-container-high px-5 py-2 text-sm font-semibold text-on-surface transition-opacity hover:opacity-75 cursor-pointer"
          >
            취소
          </button>
        </div>
      </div>

      {/* 저장 확인 / 결과 안내 대화상자 */}
      {dialog && (
        <DialogOverlay>
          {dialog.type === 'confirm' ? (
            <Confirm
              variant="info"
              title="저장 확인"
              confirmText="저장"
              cancelText="취소"
              onConfirm={handleConfirmSave}
              onCancel={() => setDialog(null)}
            >
              저장하시겠습니까?
            </Confirm>
          ) : (
            <Alert variant={dialog.variant} title={dialog.title} onClose={handleCloseAlert}>
              {dialog.message}
            </Alert>
          )}
        </DialogOverlay>
      )}
    </>
  );
}
