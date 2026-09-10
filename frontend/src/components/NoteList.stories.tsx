import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NoteList } from './NoteList';
import { notes } from './__fixtures__/notes';

const meta = {
  title: 'Notas/NoteList',
  component: NoteList,
  args: {
    notes,
    loading: false,
    emptyMessage: 'No hay notas activas. Creá la primera arriba.',
    onEdit: () => {},
    onDelete: () => {},
    onToggleArchive: () => {},
  },
} satisfies Meta<typeof NoteList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConNotas: Story = {};

/** Placeholders animados mientras llega la primera respuesta de la API. */
export const Cargando: Story = { args: { loading: true, notes: [] } };

export const Vacio: Story = { args: { notes: [] } };

export const VacioPorFiltro: Story = {
  args: { notes: [], emptyMessage: 'No hay notas con esta categoría.' },
};

/**
 * Cuando la API no responde, la lista explica qué pasó en lugar de quedar
 * simplemente vacía (el toast de error se muestra por separado).
 */
export const ConError: Story = {
  args: {
    notes: [],
    emptyMessage:
      'No se pudieron cargar las notas. Revisá que la API esté corriendo.',
  },
};
