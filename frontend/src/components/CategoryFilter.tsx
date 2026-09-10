'use client';

import type { Category } from '../types';
import { input, muted } from './ui';

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
    <label className="flex w-full items-center gap-2 sm:w-auto">
      <span className={`${muted} shrink-0`}>Categoría</span>
      <select
        value={selectedId ?? ''}
        onChange={(event) =>
          onChange(event.target.value === '' ? null : Number(event.target.value))
        }
        className={`${input} sm:w-44`}
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
