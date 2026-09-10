import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NoteCard } from './NoteCard';
import {
  archivedNote,
  emptyNote,
  longNote,
  note,
  noteWithManyCategories,
} from './__fixtures__/notes';

const meta = {
  title: 'Notas/NoteCard',
  component: NoteCard,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  args: {
    onEdit: () => {},
    onDelete: () => {},
    onToggleArchive: () => {},
  },
} satisfies Meta<typeof NoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Activa: Story = { args: { note } };

export const ConVariasCategorias: Story = {
  args: { note: noteWithManyCategories },
};

/** Una nota archivada ofrece "Desarchivar" en lugar de "Archivar". */
export const Archivada: Story = { args: { note: archivedNote } };

/** El cuerpo es opcional: la tarjeta no debe dejar un hueco. */
export const SinContenido: Story = { args: { note: emptyNote } };

/** Comprueba el corte de palabras y que la grilla no se rompa. */
export const TextoLargo: Story = { args: { note: longNote } };
