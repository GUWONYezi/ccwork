import { useState, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import { useTagEditor } from '../hooks/useTagEditor';
import { TagInput } from './TagInput';
import { TagList } from './TagList';

interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}

export function NoteEditor({ selectedNoteId, isCreating, onDone }: NoteEditorProps) {
  const { notes, createNote, updateNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const {
    tags,
    isInputOpen,
    inputValue,
    toggleInput,
    changeInput,
    addTag,
    reset,
    removeTag,
    errorMessage,
  } = useTagEditor();

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // 선택된 노트나 새 노트 작성 모드가 바뀔 때 폼(제목, 내용, 태그) 동기화
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      reset(selectedNote.tags ?? []);
    } else if (isCreating) {
      setTitle('');
      setContent('');
      reset([]);
    }
  }, [selectedNoteId, isCreating]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!title.trim()) {
      console.error('제목을 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        await createNote(title, content, tags);
      } else if (selectedNoteId) {
        await updateNote(selectedNoteId, { title, content, tags });
      }
      onDone();
    } catch (e) {
      console.error('저장에 실패했습니다', e);
    } finally {
      setSaving(false);
    }
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
        className="w-full text-xl font-bold text-on-surface bg-surface-container-lowest border border-outline-variant/15 focus:border-tertiary rounded-md px-3 py-2 outline-none placeholder:text-on-surface-variant/50 mb-4"
      />

      {/* 태그 */}
      <div className="flex flex-col gap-2 mb-4">
        <TagInput
          isOpen={isInputOpen}
          value={inputValue}
          onToggle={toggleInput}
          onChange={changeInput}
          onSubmit={addTag}
          errorMessage={errorMessage}
        />
        <TagList tags={tags} onDelete={removeTag} />
      </div>

      {/* 내용 입력 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요..."
        aria-label="노트 내용"
        rows={14}
        className="w-full text-base text-on-surface-variant bg-surface-container-lowest border border-outline-variant/15 focus:border-tertiary rounded-md px-3 py-2 outline-none resize-none placeholder:text-on-surface-variant/50 leading-relaxed"
      />

      {/* 버튼 영역 */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-linear-to-br from-tertiary to-tertiary-container text-on-tertiary px-5 py-2 rounded-md text-sm font-semibold hover:opacity-75 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={onDone}
          className="px-5 py-2 rounded-md text-sm font-semibold text-on-surface bg-surface-container-high hover:opacity-75 transition-opacity cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}
