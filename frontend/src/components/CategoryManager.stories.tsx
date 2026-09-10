import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CategoryManager } from './CategoryManager';
import { categories } from './__fixtures__/notes';

const meta = {
  title: 'Categorías/CategoryManager',
  component: CategoryManager,
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
  args: {
    categories,
    // Annotated so TypeScript widens to boolean; otherwise it infers the
    // literal `true` and the slow-resolving override below stops assigning.
    onCreate: async (): Promise<boolean> => true,
    onDelete: () => {},
  },
} satisfies Meta<typeof CategoryManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConCategorias: Story = {};

export const Vacio: Story = { args: { categories: [] } };

/**
 * Mientras se envía, el campo y el botón quedan deshabilitados: sin eso, un
 * segundo envío rápido se mezcla con el texto que todavía no se limpió.
 */
export const Enviando: Story = {
  args: {
    onCreate: () => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 5000)),
  },
};
