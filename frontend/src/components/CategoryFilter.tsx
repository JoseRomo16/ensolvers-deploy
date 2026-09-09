import type { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedId: number | null;
  onChange: (categoryId: number | null) => void;
}

export function CategoryFilter({
  categories,
  selectedId,
  onChange,
}: CategoryFilterProps) {
  return (
    <label className="filter">
      <span className="filter__label">Categoría</span>
      <select
        className="filter__select"
        value={selectedId ?? ''}
        onChange={(event) =>
          onChange(event.target.value === '' ? null : Number(event.target.value))
        }
      >
        <option value="">Todas</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  );
}
