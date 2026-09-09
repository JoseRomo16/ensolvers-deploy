import type { Note } from '../types';
import { NoteCard } from './NoteCard';

interface NoteListProps {
  notes: Note[];
  loading: boolean;
  emptyMessage: string;
  onEdit: (note: Note) => void;
  onDelete: (noteId: number) => void;
  onToggleArchive: (note: Note) => void;
}

export function NoteList({
  notes,
  loading,
  emptyMessage,
  onEdit,
  onDelete,
  onToggleArchive,
}: NoteListProps) {
  if (loading) {
    return <p className="hint">Cargando notas…</p>;
  }

  if (notes.length === 0) {
    return <p className="hint">{emptyMessage}</p>;
  }

  return (
    <div className="notes">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleArchive={onToggleArchive}
        />
      ))}
    </div>
  );
}
