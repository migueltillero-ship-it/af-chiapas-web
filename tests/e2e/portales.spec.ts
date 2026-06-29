import { test, expect } from '@playwright/test';

test.describe('Portales', () => {
  test('portal del alumno carga el formulario folio + email', async ({ page }) => {
    await page.goto('/portal/');
    await expect(page.getByLabel(/Folio/i)).toBeVisible();
    await expect(page.getByLabel(/Correo registrado/i)).toBeVisible();
  });

  test('portal del docente muestra login', async ({ page }) => {
    await page.goto('/portal/docente.html');
    // Si Supabase no está configurado: muestra warning; si sí, muestra login.
    const hayLogin   = await page.locator('#login-form').isVisible().catch(() => false);
    const hayWarning = await page.locator('.cfg-warn').isVisible().catch(() => false);
    expect(hayLogin || hayWarning).toBeTruthy();
  });

  test('panel admin muestra login o warning', async ({ page }) => {
    await page.goto('/admin/');
    const hayLogin   = await page.locator('#login-form').isVisible().catch(() => false);
    const hayWarning = await page.locator('.cfg-warn').isVisible().catch(() => false);
    expect(hayLogin || hayWarning).toBeTruthy();
  });
});
