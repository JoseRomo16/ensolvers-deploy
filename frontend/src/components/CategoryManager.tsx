'use client';

import { useState, type FormEvent } from 'react';
import type { Category } from '../types';
import { button, card, cx, input, muted } from './ui';

interface CategoryManagerProps {
  categories: Category[];
  onCreate: (name: string) => Promise<boolean>;
  onDelete: (categoryId: number) => void;
}

export function CategoryManager({
  categories,
  onCreate,
  onDelete,
}: CategoryManagerProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    // The field is cleared asynchronously, so without this guard a fast second
    // submit can race the reset and mix both names together.
    if (trimmed === '' || submitting) {
      return;
    }

    setSubmitting(true);
    const ok = await onCreate(trimmed);
    setSubmitting(false);

    if (ok) {
      setName('');
    }
  };

  return (
    <aside className={card}>
      <h2 className="mb-3 text-base font-semibold">Categorías</h2>

      <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
        <input
          value={name}
          maxLength={60}
          placeholder="Nueva categoría"
          disabled={submitting}
          onChange={(event) => setName(event.target.value)}
          className={input}
        />
        <button
          type="submit"
          disabled={submitting || name.trim() === ''}
          className={cx(button.base, button.primary, 'shrink-0')}
        >
          Agregar
        </button>
      </form>

      {categories.length === 0 ? (
        <p className={muted}>Sin categorías todavía.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="truncate text-sm">{category.name}</span>
              <button
                type="button"
                aria-label={`Eliminar categoría ${category.name}`}
                onClick={() => {
                  if (
                    window.confirm(`¿Eliminar la categoría "${category.name}"?`)
                  ) {
                    onDelete(category.id);
                  }
                }}
                className="shrink-0 rounded-md px-2 py-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
