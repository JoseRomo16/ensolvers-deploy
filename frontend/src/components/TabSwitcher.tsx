'use client';

import { cx } from './ui';

interface TabSwitcherProps {
  archived: boolean;
  onChange: (archived: boolean) => void;
}

const tabBase =
  'flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

export function TabSwitcher({ archived, onChange }: TabSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Estado de las notas"
      className="flex w-full rounded-full border border-slate-200 bg-white p-1 sm:w-auto dark:border-slate-700 dark:bg-slate-800"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!archived}
        onClick={() => onChange(false)}
        className={cx(
          tabBase,
          archived
            ? 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            : 'bg-blue-600 text-white',
        )}
      >
        Activas
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={archived}
        onClick={() => onChange(true)}
        className={cx(
          tabBase,
          archived
            ? 'bg-blue-600 text-white'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
        )}
      >
        Archivadas
      </button>
    </div>
  );
}
