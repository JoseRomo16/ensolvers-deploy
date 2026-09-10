import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The suite runs against a shared database, so every test namespaces the rows
 * it creates instead of assuming an empty or known dataset.
 */
export function unique(prefix: string): string {
  return `${prefix} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Deletes go through window.confirm, which would otherwise block the run. */
export function acceptDialogs(page: Page): void {
  page.on('dialog', (dialog) => {
    void dialog.accept();
  });
}

export async function openApp(page: Page): Promise<void> {
  acceptDialogs(page);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Notas', level: 1 }),
  ).toBeVisible();
}

/** The note form, whether it is in "create" or "edit" mode. */
export function noteForm(page: Page): Locator {
  return page.locator('form').filter({ has: page.getByPlaceholder('Título') });
}

/** The card for a note, located by its title rather than by position. */
export function noteCard(page: Page, title: string): Locator {
  return page.locator('article').filter({ hasText: title });
}

/** Toggles a category chip inside the note form. */
export async function toggleCategoryInForm(
  page: Page,
  category: string,
): Promise<void> {
  await noteForm(page).locator('label').filter({ hasText: category }).first().click();
}

export async function createNote(
  page: Page,
  title: string,
  options: { content?: string; category?: string } = {},
): Promise<void> {
  await page.getByPlaceholder('Título').fill(title);
  if (options.content) {
    await page.getByPlaceholder('Contenido').fill(options.content);
  }
  if (options.category) {
    await toggleCategoryInForm(page, options.category);
  }
  await page.getByRole('button', { name: 'Crear nota' }).click();
  await expect(page.getByText('Nota creada')).toBeVisible();
}

export async function createCategory(page: Page, name: string): Promise<void> {
  await page.getByPlaceholder('Nueva categoría').fill(name);
  await page.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByText('Categoría creada')).toBeVisible();
}
