import { useEffect, useState, type FormEvent } from 'react';
import type { Category, Note } from '../types';
import { CategoryPicker } from './CategoryPicker';

export interface NoteFormValues {
  title: string;
  content: string;
  categoryIds: number[];
}

interface NoteFormProps {
  categories: Category[];
  /** When set, the form edits that note instead of creating a new one. */
  note: Note | null;
  onSubmit: (values: NoteFormValues) => Promise<boolean>;
  onCancel: () => void;
}

export function NoteForm({
  categories,
  note,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Reload the fields whenever the note being edited changes.
  useEffect(() => {
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '');
    setCategoryIds(note?.categories.map((category) => category.id) ?? []);
  }, [note]);

  const toggleCategory = (categoryId: number) => {
    setCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed === '' || submitting) {
      return;
    }

    setSubmitting(true);
    const ok = await onSubmit({ title: trimmed, content, categoryIds });
    setSubmitting(false);

    if (ok && !note) {
      setTitle('');
      setContent('');
      setCategoryIds([]);
    }
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2 className="form__title">{note ? 'Editar nota' : 'Nueva nota'}</h2>

      <input
        className="input"
        placeholder="Título"
        value={title}
        maxLength={255}
        required
        onChange={(event) => setTitle(event.target.value)}
      />

      <textarea
        className="input textarea"
        placeholder="Contenido"
        rows={4}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />

      <CategoryPicker
        categories={categories}
        selectedIds={categoryIds}
        onToggle={toggleCategory}
      />

      <div className="form__actions">
        <button
          type="submit"
          className="button button--primary"
          disabled={submitting || title.trim() === ''}
        >
          {note ? 'Guardar cambios' : 'Crear nota'}
        </button>
        {note && (
          <button
            type="button"
            className="button button--ghost"
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
