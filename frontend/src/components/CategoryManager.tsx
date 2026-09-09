import { useState, type FormEvent } from 'react';
import type { Category } from '../types';

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
    // The field is cleared asynchronously, so without this guard a fast
    // second submit can race the reset and mix both names together.
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
    <aside className="panel">
      <h2 className="panel__title">Categorías</h2>

      <form className="panel__form" onSubmit={handleSubmit}>
        <input
          className="input"
          value={name}
          maxLength={60}
          placeholder="Nueva categoría"
          disabled={submitting}
          onChange={(event) => setName(event.target.value)}
        />
        <button
          type="submit"
          className="button button--primary"
          disabled={submitting || name.trim() === ''}
        >
          Agregar
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="hint">Sin categorías todavía.</p>
      ) : (
        <ul className="panel__list">
          {categories.map((category) => (
            <li key={category.id} className="panel__item">
              <span>{category.name}</span>
              <button
                type="button"
                className="button button--ghost"
                aria-label={`Eliminar categoría ${category.name}`}
                onClick={() => {
                  if (
                    window.confirm(`¿Eliminar la categoría "${category.name}"?`)
                  ) {
                    onDelete(category.id);
                  }
                }}
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
