import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CategoryFilter } from './CategoryFilter';
import { categories } from './__fixtures__/notes';

const meta = {
  title: 'Categorías/CategoryFilter',
  component: CategoryFilter,
  args: {
    categories,
    selectedId: null,
    onChange: () => {},
  },
} satisfies Meta<typeof CategoryFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TodasLasCategorias: Story = {};

export const ConCategoriaElegida: Story = { args: { selectedId: 2 } };

export const SinCategorias: Story = { args: { categories: [] } };
