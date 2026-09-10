import { expect, test } from '@playwright/test';
import { createNote, noteCard, openApp, unique } from './helpers';

test.describe('Notas', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('crea una nota y la muestra en la lista', async ({ page }) => {
    const title = unique('E2E crear');

    await createNote(page, title, { content: 'Contenido de la nota' });

    const card = noteCard(page, title);
    await expect(card).toBeVisible();
    await expect(card.getByText('Contenido de la nota')).toBeVisible();

    // El formulario vuelve a quedar vacío para la próxima nota.
    await expect(page.getByPlaceholder('Título')).toHaveValue('');
  });

  test('edita el título de una nota', async ({ page }) => {
    const title = unique('E2E editar');
    const renamed = `${title} (editada)`;

    await createNote(page, title);
    await noteCard(page, title).getByRole('button', { name: 'Editar' }).click();

    await expect(page.getByRole('heading', { name: 'Editar nota' })).toBeVisible();
    await expect(page.getByPlaceholder('Título')).toHaveValue(title);

    await page.getByPlaceholder('Título').fill(renamed);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText('Nota actualizada').first()).toBeVisible();
    await expect(noteCard(page, renamed)).toBeVisible();
    // El formulario vuelve al modo de creación.
    await expect(page.getByRole('heading', { name: 'Nueva nota' })).toBeVisible();
  });

  test('archiva una nota y la mueve entre pestañas', async ({ page }) => {
    const title = unique('E2E archivar');
    await createNote(page, title);

    await noteCard(page, title).getByRole('button', { name: 'Archivar' }).click();
    await expect(page.getByText('Nota archivada').first()).toBeVisible();

    // Ya no está en Activas.
    await expect(noteCard(page, title)).toHaveCount(0);

    await page.getByRole('tab', { name: 'Archivadas' }).click();
    const archived = noteCard(page, title);
    await expect(archived).toBeVisible();
    await expect(archived.getByRole('button', { name: 'Desarchivar' })).toBeVisible();
  });

  test('desarchiva una nota y vuelve a Activas', async ({ page }) => {
    const title = unique('E2E desarchivar');
    await createNote(page, title);
    await noteCard(page, title).getByRole('button', { name: 'Archivar' }).click();
    await expect(page.getByText('Nota archivada').first()).toBeVisible();

    await page.getByRole('tab', { name: 'Archivadas' }).click();
    await noteCard(page, title)
      .getByRole('button', { name: 'Desarchivar' })
      .click();
    await expect(page.getByText('Nota desarchivada').first()).toBeVisible();

    await page.getByRole('tab', { name: 'Activas' }).click();
    await expect(noteCard(page, title)).toBeVisible();
  });

  test('elimina una nota', async ({ page }) => {
    const title = unique('E2E eliminar');
    await createNote(page, title);

    await noteCard(page, title).getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.getByText('Nota eliminada').first()).toBeVisible();
    await expect(noteCard(page, title)).toHaveCount(0);
  });

  test('los datos sobreviven a una recarga', async ({ page }) => {
    const title = unique('E2E persistencia');
    await createNote(page, title);

    await page.reload();

    await expect(noteCard(page, title)).toBeVisible();
  });
});
