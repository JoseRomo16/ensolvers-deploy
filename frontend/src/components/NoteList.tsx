'use client';

import type { Note } from '../types';
import { NoteCard } from './NoteCard';
import { card, cx, muted } from './ui';

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
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-busy="true"
        aria-label="Cargando notas"
      >
        {[0, 1, 2].map((key) => (
          <div key={key} className={cx(card, 'animate-pulse')}>
            <div className="mb-3 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mb-2 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <p className={cx(muted, 'rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700')}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
