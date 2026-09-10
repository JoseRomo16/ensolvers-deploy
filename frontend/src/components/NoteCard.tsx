'use client';

import type { Note } from '../types';
import { button, card, chip, cx } from './ui';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: number) => void;
  onToggleArchive: (note: Note) => void;
}

const dateFormatter = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onToggleArchive,
}: NoteCardProps) {
  return (
    <article className={cx(card, 'flex flex-col gap-3')}>
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold break-words">{note.title}</h3>
        <time
          dateTime={note.updatedAt}
          className="shrink-0 text-xs text-slate-400 dark:text-slate-500"
        >
          {dateFormatter.format(new Date(note.updatedAt))}
        </time>
      </header>

      {note.content && (
        <p className="text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">
          {note.content}
        </p>
      )}

      {note.categories.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {note.categories.map((category) => (
            <li key={category.id} className={chip}>
              {category.name}
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-auto flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onEdit(note)}
          className={cx(button.base, button.ghost)}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onToggleArchive(note)}
          className={cx(button.base, button.ghost)}
        >
          {note.archived ? 'Desarchivar' : 'Archivar'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`¿Eliminar la nota "${note.title}"?`)) {
              onDelete(note.id);
            }
          }}
          className={cx(button.base, button.danger)}
        >
          Eliminar
        </button>
      </footer>
    </article>
  );
}
