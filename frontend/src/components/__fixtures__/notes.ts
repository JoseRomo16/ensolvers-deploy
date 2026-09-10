import type { Category, Note } from '../../types';

/** Sample data shared by the stories. Not imported by the app. */

export const categories: Category[] = [
  { id: 1, name: 'Trabajo', createdAt: '2026-01-05T10:00:00.000Z' },
  { id: 2, name: 'Personal', createdAt: '2026-01-05T10:01:00.000Z' },
  { id: 3, name: 'Ideas', createdAt: '2026-01-05T10:02:00.000Z' },
];

export const note: Note = {
  id: 1,
  title: 'Preparar el informe trimestral',
  content: 'Revisar los números de ventas y armar el resumen ejecutivo.',
  archived: false,
  categories: [categories[0]],
  createdAt: '2026-01-06T09:00:00.000Z',
  updatedAt: '2026-01-06T09:30:00.000Z',
};

export const noteWithManyCategories: Note = {
  ...note,
  id: 2,
  title: 'Idea: recordatorios por ubicación',
  content: 'Que una nota salte al llegar a un lugar determinado.',
  categories: [categories[2], categories[1]],
};

export const archivedNote: Note = {
  ...note,
  id: 3,
  title: 'Migración del servidor de staging',
  content: 'Terminada en el último sprint, se archiva como referencia.',
  archived: true,
};

export const emptyNote: Note = {
  ...note,
  id: 4,
  title: 'Nota sin contenido',
  content: '',
  categories: [],
};

export const longNote: Note = {
  ...note,
  id: 5,
  title:
    'Una nota con un título deliberadamente largo para comprobar que el texto se corta bien',
  content:
    'Contenido extenso que sirve para verificar el salto de línea y que la tarjeta no rompa el layout de la grilla cuando el texto crece mucho más de lo habitual.',
  categories: categories,
};

export const notes: Note[] = [note, noteWithManyCategories, emptyNote];
