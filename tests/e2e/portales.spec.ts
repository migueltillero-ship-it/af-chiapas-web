import { test, expect } from './fixtures';

test.describe('Portales', () => {
  test('portal del alumno carga formulario o aviso de configuración', async ({ page }) => {
    await page.goto('/portal/');
    // Con Supabase configurado: formulario visible. Sin configurar: warning con WhatsApp.
    const hayForm    = await page.getByLabel(/Folio/i).isVisible().catch(() => false);
    const hayWarning = await page.locator('.cfg-warn').isVisible().catch(() => false);
    expect(hayForm || hayWarning).toBeTruthy();
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

  test('los tres logins enlazan a la página de restablecer contraseña', async ({ page }) => {
    await page.goto('/portal/mi-espacio.html');
    await expect(page.locator('a[href="restablecer-contrasena.html"]')).toHaveText(/olvidaste tu contraseña/i);

    await page.goto('/portal/docente.html');
    await expect(page.locator('a[href="restablecer-contrasena.html"]')).toHaveText(/olvidaste tu contraseña/i);

    await page.goto('/admin/');
    await expect(page.locator('a[href="../portal/restablecer-contrasena.html"]')).toHaveText(/olvidaste tu contraseña/i);
  });

  test('restablecer-contrasena.html muestra el formulario para pedir el enlace', async ({ page }) => {
    await page.goto('/portal/restablecer-contrasena.html');
    await expect(page.locator('#view-request')).toBeVisible();
    await expect(page.locator('#rq-email')).toBeVisible();
    await expect(page.locator('#view-reset')).toBeHidden();
  });
});
