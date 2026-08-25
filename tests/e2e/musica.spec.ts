import { test, expect } from '@playwright/test';

test.describe('Música de fondo', () => {
  test('el control existe y arranca apagado', async ({ page }) => {
    await page.goto('/?nointro=1');
    const btn = page.locator('#af-music-toggle');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(btn).toHaveAttribute('aria-label', /Activar música/i);
  });

  test('el audio no se precarga ni suena solo', async ({ page }) => {
    await page.goto('/?nointro=1');
    const audio = page.locator('#af-music');
    await expect(audio).toHaveAttribute('preload', 'none');
    await expect(audio).toHaveJSProperty('paused', true);
  });

  test('al pulsarlo se enciende y cambia la etiqueta accesible', async ({ page }) => {
    await page.goto('/?nointro=1');
    const btn = page.locator('#af-music-toggle');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(btn).toHaveAttribute('aria-label', /Silenciar música/i);
    await expect(page.locator('#af-music')).toHaveJSProperty('paused', false);
  });

  test('al pulsarlo de nuevo se apaga', async ({ page }) => {
    await page.goto('/?nointro=1');
    const btn = page.locator('#af-music-toggle');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#af-music')).toHaveJSProperty('paused', true);
  });

  test('no tapa el FAB de WhatsApp (lados opuestos)', async ({ page }) => {
    await page.goto('/?nointro=1');
    const music = await page.locator('#af-music-toggle').boundingBox();
    const fab = await page.locator('.fab').first().boundingBox();
    expect(music).not.toBeNull();
    if (fab && music) expect(music.x + music.width).toBeLessThan(fab.x);
  });
});

test.describe('Música tras el intro', () => {
  test('arranca sola al saltar el intro', async ({ page }) => {
    await page.goto('/');
    await page.locator('#af-intro-skip').click();
    await expect(page.locator('#af-intro')).toHaveCount(0);
    await expect(page.locator('#af-music')).toHaveJSProperty('paused', false);
    await expect(page.locator('#af-music-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  test('arranca sola al cerrar el intro con Escape', async ({ page }) => {
    await page.goto('/');
    await page.locator('#af-intro-skip').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#af-intro')).toHaveCount(0);
    await expect(page.locator('#af-music')).toHaveJSProperty('paused', false);
  });

  test('respeta que el visitante la haya apagado antes', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('af_musica', '0'));
    await page.goto('/');
    await page.locator('#af-intro-skip').click();
    await expect(page.locator('#af-intro')).toHaveCount(0);
    await expect(page.locator('#af-music')).toHaveJSProperty('paused', true);
    await expect(page.locator('#af-music-toggle')).toHaveAttribute('aria-pressed', 'false');
  });

  test('sin intro el botón sigue mandando y no suena sola', async ({ page }) => {
    await page.goto('/?nointro=1');
    await expect(page.locator('#af-music')).toHaveJSProperty('paused', true);
    await page.locator('#af-music-toggle').click();
    await expect(page.locator('#af-music')).toHaveJSProperty('paused', false);
  });
});
