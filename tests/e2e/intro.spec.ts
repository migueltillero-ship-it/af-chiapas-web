import { test, expect } from '@playwright/test';

// El intro es un overlay modal: taparía los clics del resto de la suite.
// Por eso los demás specs entran con ?nointro=1 y aquí lo probamos de frente.
test.describe('Intro de bienvenida', () => {
  test('se muestra al entrar por primera vez en la sesión', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#af-intro')).toBeVisible();
    await expect(page.locator('#af-intro-video')).toHaveCount(1);
  });

  test('el botón de saltar lo cierra y lo quita del DOM', async ({ page }) => {
    await page.goto('/');
    await page.locator('#af-intro-skip').click();
    await expect(page.locator('#af-intro')).toHaveCount(0);
  });

  test('deja marcada la sesión al cerrarse', async ({ page }) => {
    await page.goto('/');
    await page.locator('#af-intro-skip').click();
    await expect(page.locator('#af-intro')).toHaveCount(0);
    const visto = await page.evaluate(() => sessionStorage.getItem('af_intro_visto'));
    expect(visto).toBe('1');
  });

  test('no se muestra si la sesión ya lo vio', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('af_intro_visto', '1'));
    await page.goto('/');
    await expect(page.locator('#af-intro')).toHaveCount(0);
    await expect(page.locator('.hero-title')).toBeVisible();
  });

  test('devuelve el scroll de la página al cerrarse', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await page.locator('#af-intro-skip').click();
    await expect(page.locator('#af-intro')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('la tecla Escape también lo cierra', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#af-intro')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#af-intro')).toHaveCount(0);
  });

  test('el botón de sonido alterna el estado silenciado del video', async ({ page }) => {
    await page.goto('/');
    const vid = page.locator('#af-intro-video');
    await expect(vid).toHaveJSProperty('muted', true);
    await page.locator('#af-intro-sound').click();
    await expect(vid).toHaveJSProperty('muted', false);
  });

  test('?nointro=1 lo omite por completo', async ({ page }) => {
    await page.goto('/?nointro=1');
    await expect(page.locator('#af-intro')).toHaveCount(0);
    await expect(page.locator('.hero-title')).toBeVisible();
  });

  test('se omite si el visitante pide menos movimiento', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('#af-intro')).toHaveCount(0);
    await expect(page.locator('.hero-title')).toBeVisible();
  });
});
