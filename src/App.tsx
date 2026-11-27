import { useState } from 'react';
import { NotesProvider, useNotes } from './context/NotesContext';
import { Layout } from './components/Layout';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { NotePreview } from './components/NotePreview';
import { Confirm } from './components/Confirm';
import { useConfirmAction } from './hooks/useConfirmAction';
import { SidebarFooter } from './components/SidebarFooter';
import { TrashList } from './components/TrashList';

interface TrashSidebarProps {
  selectedTrashId: string | null;
  onSelect: (id: string) => void;
  onRestored: (id: string) => void;
  onBack: () => void;
}

// 휴지통 목록: Context의 trashedNotes를 순수 컴포넌트에 연결하고 복구 확인을 처리
function TrashSidebar({ selectedTrashId, onSelect, onRestored, onBack }: TrashSidebarProps) {
  const { trashedNotes, restoreNote } = useNotes();

  const restoreConfirm = useConfirmAction<string>(async (id) => {
    await restoreNote(id);
    onRestored(id);
  });

  const handleConfirmRestore = async () => {
    try {
      await restoreConfirm.confirm();
    } catch (e) {
      console.error('복구에 실패했습니다', e);
      alert('복구에 실패했습니다');
    }
  };

  return (
    <>
      <TrashList
        notes={trashedNotes}
        selectedId={selectedTrashId}
        onSelect={onSelect}
        onRestore={restoreConfirm.request}
        onBack={onBack}
      />

      {/* 복구 확인 */}
      {restoreConfirm.pending !== null && (
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <Confirm
            variant="info"
            title="노트 복구"
            onConfirm={handleConfirmRestore}
            onCancel={restoreConfirm.cancel}
          >
            이 노트를 복구할까요?
          </Confirm>
        </div>
      )}
    </>
  );
}

interface TrashPreviewProps {
  selectedTrashId: string | null;
}

// 휴지통 미리보기: 선택된 휴지통 노트를 읽기 전용으로 연결
function TrashPreview({ selectedTrashId }: TrashPreviewProps) {
  const { trashedNotes } = useNotes();
  const note = trashedNotes.find((n) => n.id === selectedTrashId) ?? null;
  return <NotePreview note={note} />;
}

function App() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sidebarView, setSidebarView] = useState<'notes' | 'trash'>('notes');
  const [selectedTrashId, setSelectedTrashId] = useState<string | null>(null);

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsCreating(false);
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setSelectedTrashId(null);
    setSidebarView('notes');
    setIsCreating(true);
  };

  const handleDone = () => {
    setIsCreating(false);
    // 저장 후 선택 상태는 유지
  };

  const handleTrashed = (id: string) => {
    if (id === selectedNoteId) setSelectedNoteId(null);
  };

  const handleOpenTrash = () => setSidebarView('trash');

  const handleCloseTrash = () => {
    setSidebarView('notes');
    setSelectedTrashId(null);
  };

  const handleSelectTrash = (id: string) => setSelectedTrashId(id);

  const handleRestored = (id: string) => {
    if (id === selectedTrashId) setSelectedTrashId(null);
  };

  const isTrashView = sidebarView === 'trash';

  return (
    <NotesProvider>
      <Layout
        onNewNote={handleNewNote}
        sidebar={
          isTrashView ? (
            <TrashSidebar
              selectedTrashId={selectedTrashId}
              onSelect={handleSelectTrash}
              onRestored={handleRestored}
              onBack={handleCloseTrash}
            />
          ) : (
            <>
              <NoteList
                selectedNoteId={selectedNoteId}
                onSelect={handleSelectNote}
                onTrashed={handleTrashed}
              />
              <SidebarFooter onOpenTrash={handleOpenTrash} />
            </>
          )
        }
        main={
          isTrashView ? (
            <TrashPreview selectedTrashId={selectedTrashId} />
          ) : (
            <NoteEditor
              selectedNoteId={selectedNoteId}
              isCreating={isCreating}
              onDone={handleDone}
            />
          )
        }
      />
    </NotesProvider>
  );
}

export default App;
