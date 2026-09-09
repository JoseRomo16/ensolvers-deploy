import type { Category } from '../types';

interface CategoryPickerProps {
  categories: Category[];
  selectedIds: number[];
  onToggle: (categoryId: number) => void;
}

/** Assigns/removes the categories of a note while it is being written or edited. */
export function CategoryPicker({
  categories,
  selectedIds,
  onToggle,
}: CategoryPickerProps) {
  if (categories.length === 0) {
    return (
      <p className="hint">
        Todavía no hay categorías. Creá una en el panel de la izquierda.
      </p>
    );
  }

  return (
    <div className="picker">
      {categories.map((category) => {
        const checked = selectedIds.includes(category.id);
        return (
          <label
            key={category.id}
            className={`picker__item ${checked ? 'picker__item--on' : ''}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(category.id)}
            />
            {category.name}
          </label>
        );
      })}
    </div>
  );
}
