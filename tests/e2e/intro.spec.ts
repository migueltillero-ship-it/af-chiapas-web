import { test, expect, soloLocal } from './fixtures';

// Estos tests sí quieren ver el intro, así que piden movimiento normal.
test.use({ reducedMotion: 'no-preference' });


test.describe('Intro de marca', () => {
  test('el intro aparece al entrar y bloquea el scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#af-intro')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/af-intro-lock/);
  });

  test('el botón Saltar cierra el intro y libera la página', async ({ page }) => {
    await page.goto('/');
    await page.locator('#af-intro-skip').click();
    await expect(page.locator('#af-intro')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/af-intro-lock/);
    await expect(page.locator('.hero-title')).toBeVisible();
  });

  test('Escape también cierra el intro', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Escape');
    await expect(page.locator('#af-intro')).toHaveCount(0);
  });

  test('el intro se cierra solo y nunca deja la página bloqueada', async ({ page }) => {
    await page.goto('/');
    // El video dura 10 s y hay una red de seguridad a los 12 s.
    await expect(page.locator('#af-intro')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('body')).not.toHaveClass(/af-intro-lock/);
  });

  test('con prefers-reduced-motion no hay intro', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await soloLocal(page);
    await page.goto('/');
    await expect(page.locator('#af-intro')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/af-intro-lock/);
    await ctx.close();
  });
});

test.describe('Música de fondo', () => {
  test('el control de música aparece tras el intro y se puede silenciar', async ({ page }) => {
    await page.goto('/');
    await page.locator('#af-intro-skip').click();
    const toggle = page.locator('#af-bgm-toggle');
    await expect(toggle).toBeVisible();
    // Silenciar deja el audio en pausa y guarda la preferencia.
    await toggle.click();
    await expect.poll(() => page.evaluate(() => {
      const a = document.getElementById('af-bgm') as HTMLAudioElement | null;
      return a ? a.paused : true;
    })).toBe(true);
  });
});
