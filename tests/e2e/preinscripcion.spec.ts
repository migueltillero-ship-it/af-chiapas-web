import { test, expect } from '@playwright/test';

test.describe('Flujo de preinscripción', () => {
  test('avanza paso 1 → 2 → 3 con selección virtual', async ({ page }) => {
    await page.goto('/#preinscripcion');
    await expect(page.locator('#step-1')).toBeVisible();

    // Paso 1: seleccionar AF Virtual
    await page.locator('.sede-btn.virtual').click();
    await expect(page.locator('#step-2')).toBeVisible();

    // Paso 2: programa
    await page.locator('#f-curso').selectOption({ index: 1 });
    await page.locator('[data-formato="grupal"]').click();
    await page.locator('[data-ritmo="regular"]').click();

    // Continuar a paso 3
    await page.getByRole('button', { name: /Continuar/ }).click();
    await expect(page.locator('#step-3')).toBeVisible();

    // Verificar que el resumen muestra datos
    await expect(page.locator('#sum-formato')).toContainText(/Individual|Grupal/);
    await expect(page.locator('#sum-ritmo')).toContainText(/Regular/);
  });

  test('valida campos requeridos del paso 3', async ({ page }) => {
    await page.goto('/#preinscripcion');
    await page.locator('.sede-btn.virtual').click();
    await page.locator('#f-curso').selectOption({ index: 1 });
    await page.locator('[data-formato="individual"]').click();
    await page.locator('[data-ritmo="intensivo"]').click();
    await page.getByRole('button', { name: /Continuar/ }).click();

    // Intentar enviar sin datos
    await page.locator('#btn-enviar').click();
    await expect(page.locator('#err-nombre')).toBeVisible();
    await expect(page.locator('#err-email')).toBeVisible();
    await expect(page.locator('#err-tel')).toBeVisible();
  });
});
