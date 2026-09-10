import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';
import { CategoryPicker } from './CategoryPicker';
import { categories } from './__fixtures__/notes';

const meta = {
  title: 'Categorías/CategoryPicker',
  component: CategoryPicker,
  args: {
    categories,
    selectedIds: [],
    onToggle: () => {},
  },
} satisfies Meta<typeof CategoryPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NingunaSeleccionada: Story = {};

export const AlgunasSeleccionadas: Story = { args: { selectedIds: [1, 3] } };

export const SinCategorias: Story = { args: { categories: [] } };

/**
 * El estado vive en la historia para poder probar el toggle. Es un componente
 * con nombre y no una función inline para que las reglas de hooks lo reconozcan.
 */
function PickerConEstado(props: ComponentProps<typeof CategoryPicker>) {
  const [selected, setSelected] = useState<number[]>([2]);

  return (
    <CategoryPicker
      {...props}
      selectedIds={selected}
      onToggle={(id) =>
        setSelected((current) =>
          current.includes(id)
            ? current.filter((value) => value !== id)
            : [...current, id],
        )
      }
    />
  );
}

export const Interactivo: Story = {
  render: (args) => <PickerConEstado {...args} />,
};
