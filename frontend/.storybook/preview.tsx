import type { Decorator, Preview } from '@storybook/nextjs-vite';
import { useEffect, type ReactNode } from 'react';
import { Toaster } from 'sonner';
// Tailwind, so stories render with the same styles as the app.
import '../src/app/globals.css';

/**
 * Mirrors the app: dark mode is a class on <html>, not the media query, so the
 * toolbar switch drives the same mechanism the ThemeToggle uses.
 *
 * A named component rather than the hook inline in the decorator, so the
 * rules-of-hooks lint rule can see it for what it is.
 */
function StoryFrame({
  theme,
  children,
}: {
  theme: 'light' | 'dark';
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="p-4">
      {children}
      {/* Stories that trigger toasts render them here, as the app does. */}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

const withTheme: Decorator = (Story, context) => (
  <StoryFrame theme={(context.globals.theme as 'light' | 'dark') ?? 'light'}>
    <Story />
  </StoryFrame>
);

const preview: Preview = {
  decorators: [withTheme],

  globalTypes: {
    theme: {
      description: 'Tema de la aplicación',
      toolbar: {
        title: 'Tema',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Claro' },
          { value: 'dark', title: 'Oscuro' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: { theme: 'light' },

  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'error' would fail the run on violations; 'todo' surfaces them in the
      // panel while the component library is still being filled in.
      test: 'todo',
    },
  },
};

export default preview;
