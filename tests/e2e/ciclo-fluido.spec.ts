import { test, expect } from '@playwright/test';

test.describe('Ciclo estándar → preinscripción fluida', () => {
  test('clic en tarjeta 12h/bimestre lleva al paso 3 con formato y ritmo preseleccionados', async ({ page }) => {
    await page.goto('/');
    await page.locator('#ciclo .ciclo-card.ciclo-clic').first().click();
    await page.waitForTimeout(600);
    await expect(page.locator('#step-3')).toHaveClass(/active/);
    await expect(page.locator('#f-curso')).toHaveValue('adultos');
    await expect(page.locator('[data-formato="grupal"]')).toHaveClass(/active/);
    await expect(page.locator('[data-ritmo="regular"]')).toHaveClass(/active/);
    await expect(page.locator('#sum-formato')).toHaveText('Grupal');
    await expect(page.locator('#sum-ritmo')).toContainText('Ritmo Básico');
  });

  test('clic en tarjeta de niños lleva al paso 2 con curso preseleccionado', async ({ page }) => {
    await page.goto('/');
    await page.locator('#ciclo .ciclo-card.ciclo-clic[data-r="ninos"]').click();
    await page.waitForTimeout(600);
    await expect(page.locator('#step-2')).toHaveClass(/active/);
    await expect(page.locator('#f-curso')).toHaveValue('ninos');
  });

  test('dropdown de nivel incluye DELF, DALF y A1-C2', async ({ page }) => {
    await page.goto('/');
    await page.locator('#ciclo .ciclo-card.ciclo-clic').first().click();
    await page.waitForTimeout(600);
    const options = await page.locator('#f-nivel option').allTextContents();
    const joined = options.join(' | ');
    expect(joined).toContain('DELF');
    expect(joined).toContain('DALF');
    for (const lvl of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      expect(joined).toContain(lvl);
    }
  });
});
