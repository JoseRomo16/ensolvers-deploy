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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === '') {
      return;
    }
    if (await onCreate(trimmed)) {
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
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit" className="button button--primary">
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
