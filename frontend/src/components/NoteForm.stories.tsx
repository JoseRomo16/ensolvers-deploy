import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NoteForm } from './NoteForm';
import { categories, note } from './__fixtures__/notes';

const meta = {
  title: 'Notas/NoteForm',
  component: NoteForm,
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: {
    categories,
    note: null,
    onSubmit: async () => true,
    onCancel: () => {},
  },
} satisfies Meta<typeof NoteForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "Crear nota" arranca deshabilitado hasta que haya un título. */
export const Crear: Story = {};

/**
 * En edición los campos vienen precargados y aparece "Cancelar". El reset se
 * hace remontando el componente con una `key`, no sincronizando props a estado.
 */
export const Editar: Story = { args: { note } };

/** Sin categorías cargadas, el selector explica qué hacer en vez de quedar vacío. */
export const SinCategorias: Story = { args: { categories: [] } };
