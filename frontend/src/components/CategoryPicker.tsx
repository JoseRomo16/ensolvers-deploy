'use client';

import type { Category } from '../types';
import { cx, muted } from './ui';

interface CategoryPickerProps {
  categories: Category[];
  selectedIds: number[];
  onToggle: (categoryId: number) => void;
}

/** Assigns and removes the categories of a note while it is written or edited. */
export function CategoryPicker({
  categories,
  selectedIds,
  onToggle,
}: CategoryPickerProps) {
  if (categories.length === 0) {
    return <p className={muted}>Todavía no hay categorías. Creá una primero.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const checked = selectedIds.includes(category.id);
        return (
          <label
            key={category.id}
            className={cx(
              'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors',
              checked
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(category.id)}
              className="size-3.5 accent-blue-600"
            />
            {category.name}
          </label>
        );
      })}
    </div>
  );
}
