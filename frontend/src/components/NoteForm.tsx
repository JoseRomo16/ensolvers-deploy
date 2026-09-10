'use client';

import { useState, type FormEvent } from 'react';
import type { Category, Note } from '../types';
import { CategoryPicker } from './CategoryPicker';
import { button, card, cx, input } from './ui';

export interface NoteFormValues {
  title: string;
  content: string;
  categoryIds: number[];
}

interface NoteFormProps {
  categories: Category[];
  /**
   * When set, the form edits that note instead of creating a new one.
   *
   * The caller must give this component a `key` derived from the note id so
   * React remounts it when the selection changes. That is what resets the
   * fields — an effect syncing props into state would re-render twice and is
   * what React's own guidance replaces with this pattern.
   */
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
  const [title, setTitle] = useState(() => note?.title ?? '');
  const [content, setContent] = useState(() => note?.content ?? '');
  const [categoryIds, setCategoryIds] = useState<number[]>(
    () => note?.categories.map((category) => category.id) ?? [],
  );
  const [submitting, setSubmitting] = useState(false);

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
    <form onSubmit={handleSubmit} className={cx(card, 'flex flex-col gap-3')}>
      <h2 className="text-base font-semibold">
        {note ? 'Editar nota' : 'Nueva nota'}
      </h2>

      <input
        value={title}
        maxLength={255}
        required
        placeholder="Título"
        onChange={(event) => setTitle(event.target.value)}
        className={input}
      />

      <textarea
        value={content}
        rows={4}
        placeholder="Contenido"
        onChange={(event) => setContent(event.target.value)}
        className={cx(input, 'resize-y')}
      />

      <CategoryPicker
        categories={categories}
        selectedIds={categoryIds}
        onToggle={toggleCategory}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting || title.trim() === ''}
          className={cx(button.base, button.primary)}
        >
          {note ? 'Guardar cambios' : 'Crear nota'}
        </button>
        {note && (
          <button
            type="button"
            onClick={onCancel}
            className={cx(button.base, button.ghost)}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
