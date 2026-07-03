import { test, expect } from '@playwright/test';

test.describe('Landing pública', () => {
  test('carga el hero con título y CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Alliance Française San Cristóbal/);
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.getByRole('link', { name: /Inscribirme ahora/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Empezar preinscripción/i }).first()).toBeVisible();
  });

  test('promo banner clase gratis visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.promo-banner-title')).toContainText(/gratis/i);
  });

  test('sección DELF reposicionada a "Preparación oficial"', async ({ page }) => {
    await page.goto('/');
    await page.locator('#certifications').scrollIntoViewIfNeeded();
    await expect(page.locator('#certifications .section-title')).toContainText(/Preparación/i);
  });

  test('galería de carteles carga los 6 carteles', async ({ page }) => {
    await page.goto('/');
    const posters = page.locator('#galeria .poster');
    await expect(posters).toHaveCount(6);
  });

  test('toggle de idioma cambia el hero a francés', async ({ page }) => {
    await page.goto('/');
    await page.locator('#lang-toggle').click();
    await expect(page.locator('[data-i18n="hero.cta1"]')).toContainText(/M'inscrire/i);
  });
});
