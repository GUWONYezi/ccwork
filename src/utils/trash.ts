import type { Note } from '../types/note';

export interface PartitionedNotes {
  activeNotes: Note[]; // deletedAt == null (필드 없음 포함)
  trashedNotes: Note[]; // deletedAt != null
}

export function partitionNotes(notes: Note[]): PartitionedNotes {
  return {
    activeNotes: notes.filter((note) => note.deletedAt == null),
    trashedNotes: notes.filter((note) => note.deletedAt != null),
  };
}

export function sortByDeletedAt(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
}
