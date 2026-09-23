import { test, expect } from '@playwright/test';

test.describe('Equipo docente → "Inscríbete conmigo"', () => {
  test('la sección muestra a los 5 docentes', async ({ page }) => {
    await page.goto('/docentes.html');
    await expect(page.locator('.docente-card')).toHaveCount(5);
    await expect(page.locator('.docente-card')).toContainText([
      'Alejandro Avendaño',
      'Alejandra Estrada',
      'Fanny Franco',
      'Miguel Tillero',
      'Lucía Rangel',
    ]);
  });

  test('clic en "Inscríbete conmigo" revela particular/grupo, y elegir uno lleva a preinscripción con el formato preseleccionado', async ({ page }) => {
    await page.goto('/docentes.html');
    const card = page.locator('.docente-card', { hasText: 'Fanny Franco' });
    await card.locator('.docente-cta').click();
    const choice = card.locator('.docente-choice');
    await expect(choice).toHaveClass(/show/);
    await choice.locator('button', { hasText: 'Clase en grupo' }).click();
    await page.waitForURL(/preinscripcion\.html/);
    await page.waitForTimeout(600);
    await expect(page.locator('#step-2')).toHaveClass(/active/);
    await expect(page.locator('[data-formato="grupal"]')).toHaveClass(/active/);
  });

  test('la preinscripción con docente prellena el mensaje y, al completar el resto, el resumen lo conserva', async ({ page }) => {
    await page.goto('/docentes.html');
    const card = page.locator('.docente-card', { hasText: 'Alejandro Avendaño' });
    await card.locator('.docente-cta').click();
    await card.locator('.docente-choice button', { hasText: 'Clase particular' }).click();
    await page.waitForURL(/preinscripcion\.html/);
    await page.waitForTimeout(600);
    await expect(page.locator('#f-mensaje')).toHaveValue(/Alejandro Avendaño/);
    await page.selectOption('#f-curso', 'adultos');
    await page.locator('[data-ritmo="regular"]').click();
    await page.locator('#step-2 .form-actions .btn-primary').click();
    await expect(page.locator('#step-3')).toHaveClass(/active/);
    await expect(page.locator('#sum-docente-row')).toBeVisible();
    await expect(page.locator('#sum-docente')).toContainText('Alejandro Avendaño');
    await expect(page.locator('#sum-docente')).toContainText('Clase particular');
    await expect(page.locator('#f-mensaje')).toHaveValue(/Alejandro Avendaño/);
  });
});
