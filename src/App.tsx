import { useState } from 'react';
import { NotesProvider, useNotes } from './context/NotesContext';
import { Layout } from './components/Layout';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { SidebarFooter } from './components/SidebarFooter';
import { TrashList } from './components/TrashList';

interface TrashSidebarProps {
  onBack: () => void;
}

// 휴지통 목록: Context의 trashedNotes를 순수 컴포넌트에 연결
function TrashSidebar({ onBack }: TrashSidebarProps) {
  const { trashedNotes } = useNotes();
  return <TrashList notes={trashedNotes} onBack={onBack} />;
}

function App() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sidebarView, setSidebarView] = useState<'notes' | 'trash'>('notes');

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsCreating(false);
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setIsCreating(true);
  };

  const handleDone = () => {
    setIsCreating(false);
    // 저장 후 선택 상태는 유지
  };

  const handleTrashed = (id: string) => {
    if (id === selectedNoteId) setSelectedNoteId(null);
  };

  return (
    <NotesProvider>
      <Layout
        onNewNote={handleNewNote}
        sidebar={
          sidebarView === 'trash' ? (
            <TrashSidebar onBack={() => setSidebarView('notes')} />
          ) : (
            <>
              <NoteList
                selectedNoteId={selectedNoteId}
                onSelect={handleSelectNote}
                onTrashed={handleTrashed}
              />
              <SidebarFooter onOpenTrash={() => setSidebarView('trash')} />
            </>
          )
        }
        main={
          <NoteEditor selectedNoteId={selectedNoteId} isCreating={isCreating} onDone={handleDone} />
        }
      />
    </NotesProvider>
  );
}

export default App;
