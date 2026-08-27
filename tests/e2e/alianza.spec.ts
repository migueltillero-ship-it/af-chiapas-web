import { test, expect } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('Alianza DELF Junior · Colegio La Salle', () => {
  test('la sección sustituye a la presentación institucional', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#delf-lasalle')).toHaveCount(1);
    await expect(page.locator('#presentacion')).toHaveCount(0);
    await expect(page.locator('#delf-lasalle .section-title')).toContainText(/Colegio La Salle/i);
  });

  test('no queda rastro de la presentación de Google Slides, que fue eliminada', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('iframe[src*="docs.google.com/presentation"]')).toHaveCount(0);
    await expect(page.locator('a[href*="docs.google.com/presentation"]')).toHaveCount(0);
  });

  test('nombra los tres papeles de la alianza', async ({ page }) => {
    await page.goto('/');
    const sec = page.locator('#delf-lasalle');
    await expect(sec).toContainText(/Alliance Française de San Cristóbal/i);
    await expect(sec).toContainText(/Colegio La Salle/i);
    await expect(sec).toContainText(/Ministerio de Educación de Francia/i);
  });

  test('enlaza al portal y al repositorio, ambos en pestaña nueva y seguros', async ({ page }) => {
    await page.goto('/');
    const portal = page.locator('#delf-lasalle a[href*="github.io/DELFLaSalle"]');
    const repo   = page.locator('#delf-lasalle a[href*="github.com/migueltillero-ship-it/DELFLaSalle"]');
    await expect(portal).toHaveCount(1);
    await expect(repo).toHaveCount(1);
    for (const l of [portal, repo]) {
      await expect(l).toHaveAttribute('target', '_blank');
      await expect(l).toHaveAttribute('rel', /noopener/);
    }
  });

  test('lista lo que ofrece el portal', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#delf-lasalle .alianza-lista li')).toHaveCount(8);
  });

  test('el menú apunta a la sección nueva', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nav-drop a[href="#delf-lasalle"]')).toHaveCount(1);
    await expect(page.locator('.nav-drop a[href="#presentacion"]')).toHaveCount(0);
  });
});
