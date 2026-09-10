import { expect, test } from '@playwright/test';
import {
  createCategory,
  createNote,
  noteCard,
  openApp,
  unique,
} from './helpers';

test.describe('Categorías', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('crea una categoría y aparece en el panel y en el selector', async ({
    page,
  }) => {
    const name = unique('Cat');

    await createCategory(page, name);

    await expect(
      page.getByRole('button', { name: `Eliminar categoría ${name}` }),
    ).toBeVisible();
    // También queda disponible como opción del filtro.
    await expect(
      page.getByRole('combobox').getByRole('option', { name }),
    ).toHaveCount(1);
    // Y el campo se limpia.
    await expect(page.getByPlaceholder('Nueva categoría')).toHaveValue('');
  });

  test('rechaza una categoría duplicada', async ({ page }) => {
    const name = unique('Dup');
    await createCategory(page, name);

    await page.getByPlaceholder('Nueva categoría').fill(name);
    await page.getByRole('button', { name: 'Agregar' }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test('asigna una categoría a una nota y la muestra como chip', async ({
    page,
  }) => {
    const category = unique('Chip');
    const title = unique('E2E con categoria');

    await createCategory(page, category);
    await createNote(page, title, { category });

    await expect(noteCard(page, title).getByText(category)).toBeVisible();
  });

  test('filtra las notas por categoría', async ({ page }) => {
    const category = unique('Filtro');
    const withCategory = unique('E2E dentro del filtro');
    const withoutCategory = unique('E2E fuera del filtro');

    await createCategory(page, category);
    await createNote(page, withCategory, { category });
    await createNote(page, withoutCategory);

    await page.getByRole('combobox').selectOption({ label: category });

    await expect(noteCard(page, withCategory)).toBeVisible();
    await expect(noteCard(page, withoutCategory)).toHaveCount(0);

    // Volver a "Todas" muestra las dos.
    await page.getByRole('combobox').selectOption({ label: 'Todas' });
    await expect(noteCard(page, withoutCategory)).toBeVisible();
  });

  test('quita una categoría de una nota al editarla', async ({ page }) => {
    const category = unique('Quitar');
    const title = unique('E2E quitar categoria');

    await createCategory(page, category);
    await createNote(page, title, { category });
    await expect(noteCard(page, title).getByText(category)).toBeVisible();

    await noteCard(page, title).getByRole('button', { name: 'Editar' }).click();
    await page
      .locator('form')
      .filter({ has: page.getByPlaceholder('Título') })
      .locator('label')
      .filter({ hasText: category })
      .first()
      .click();
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText('Nota actualizada')).toBeVisible();
    await expect(noteCard(page, title).getByText(category)).toHaveCount(0);
  });

  test('eliminar una categoría la quita del filtro', async ({ page }) => {
    const name = unique('Borrable');
    await createCategory(page, name);

    await page
      .getByRole('button', { name: `Eliminar categoría ${name}` })
      .click();

    await expect(page.getByText('Categoría eliminada')).toBeVisible();
    await expect(
      page.getByRole('combobox').getByRole('option', { name }),
    ).toHaveCount(0);
  });
});
