import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Note } from '../types/note';
import * as api from '../api/notes';
import { partitionNotes, sortByDeletedAt } from '../utils/trash';

interface NotesContextType {
  notes: Note[];
  trashedNotes: Note[]; // 휴지통 노트, 최근 삭제 순
  loading: boolean;
  error: string | null;
  createNote: (title: string, content: string, tags?: string[]) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  trashNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .fetchNotes()
      .then(setAllNotes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const { activeNotes, trashedNotes } = partitionNotes(allNotes);
  const sortedTrashedNotes = sortByDeletedAt(trashedNotes);

  const createNote = async (title: string, content: string, tags: string[] = []) => {
    const newNote = await api.createNote({ title, content, tags });
    setAllNotes((prev) => [...prev, newNote]);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const updated = await api.updateNote(id, updates);
    setAllNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  const deleteNote = async (id: string) => {
    await api.deleteNote(id);
    setAllNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const trashNote = (id: string) => updateNote(id, { deletedAt: new Date().toISOString() });

  const restoreNote = (id: string) => updateNote(id, { deletedAt: null });

  return (
    <NotesContext.Provider
      value={{
        notes: activeNotes,
        trashedNotes: sortedTrashedNotes,
        loading,
        error,
        createNote,
        updateNote,
        deleteNote,
        trashNote,
        restoreNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
