import type { Note } from '../types';

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
    <article className="card note">
      <header className="note__header">
        <h3 className="note__title">{note.title}</h3>
        <time className="note__date" dateTime={note.updatedAt}>
          {dateFormatter.format(new Date(note.updatedAt))}
        </time>
      </header>

      {note.content && <p className="note__content">{note.content}</p>}

      {note.categories.length > 0 && (
        <ul className="chips">
          {note.categories.map((category) => (
            <li key={category.id} className="chip">
              {category.name}
            </li>
          ))}
        </ul>
      )}

      <footer className="note__actions">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => onEdit(note)}
        >
          Editar
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => onToggleArchive(note)}
        >
          {note.archived ? 'Desarchivar' : 'Archivar'}
        </button>
        <button
          type="button"
          className="button button--danger"
          onClick={() => {
            if (window.confirm(`¿Eliminar la nota "${note.title}"?`)) {
              onDelete(note.id);
            }
          }}
        >
          Eliminar
        </button>
      </footer>
    </article>
  );
}
