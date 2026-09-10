'use client';

import { useTheme } from '../hooks/useTheme';
import { button, cx } from './ui';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  const label =
    theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cx(button.base, button.ghost, 'px-2.5')}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
