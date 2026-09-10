import 'reflect-metadata';
import { Category } from '../categories/category.entity';
import AppDataSource from '../config/typeorm.config';
import { Note } from '../notes/note.entity';

/**
 * Idempotent seed: it only writes when the notes table is empty, so running
 * ./start.sh repeatedly never duplicates rows.
 */
const CATEGORY_NAMES = ['Trabajo', 'Personal', 'Ideas'];

const NOTES: Array<{
  title: string;
  content: string;
  archived: boolean;
  categories: string[];
}> = [
  {
    title: 'Preparar el informe trimestral',
    content: 'Revisar los números de ventas y armar el resumen ejecutivo.',
    archived: false,
    categories: ['Trabajo'],
  },
  {
    title: 'Renovar el pasaporte',
    content: 'Sacar turno online y juntar la documentación.',
    archived: false,
    categories: ['Personal'],
  },
  {
    title: 'Idea: recordatorios por ubicación',
    content: 'Que una nota salte al llegar a un lugar determinado.',
    archived: false,
    categories: ['Ideas', 'Personal'],
  },
  {
    title: 'Migración del servidor de staging',
    content: 'Terminada en el último sprint, se archiva como referencia.',
    archived: true,
    categories: ['Trabajo'],
  },
];

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const notesRepository = AppDataSource.getRepository(Note);
    const categoriesRepository = AppDataSource.getRepository(Category);

    if ((await notesRepository.count()) > 0) {
      console.log('Seed skipped: the database already contains notes.');
      return;
    }

    const categoriesByName = new Map<string, Category>();
    for (const name of CATEGORY_NAMES) {
      const existing = await categoriesRepository.findOne({ where: { name } });
      categoriesByName.set(
        name,
        existing ?? (await categoriesRepository.save(categoriesRepository.create({ name }))),
      );
    }

    for (const note of NOTES) {
      await notesRepository.save(
        notesRepository.create({
          title: note.title,
          content: note.content,
          archived: note.archived,
          categories: note.categories
            .map((name) => categoriesByName.get(name))
            .filter((category): category is Category => category !== undefined),
        }),
      );
    }

    console.log(
      `Seed complete: ${CATEGORY_NAMES.length} categories and ${NOTES.length} notes.`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
