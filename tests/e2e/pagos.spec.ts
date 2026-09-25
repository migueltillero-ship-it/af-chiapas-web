import { test, expect } from '@playwright/test';

// Nota: unpkg.com (supabase-js) está bloqueado en este sandbox, así que
// window.supabase nunca carga y AF_CONFIG.isSupabaseConfigured()/init() fallan
// como en cualquier entorno sin ese script — es una limitación de red del
// entorno de pruebas, no algo introducido por estos cambios. Por eso estas
// pruebas verifican el DOM y que las funciones queden expuestas, sin exigir
// cero errores de consola.

test('portal index shows success/cancel pago banners and prefills folio', async ({ page }) => {
  await page.goto('/portal/?pago=ok&folio=af-260101-ab12');
  await expect(page.locator('#pago-banner')).toContainText('¡Pago recibido!');
  await expect(page.locator('#f-folio')).toHaveValue('AF-260101-AB12');

  await page.goto('/portal/?pago=cancel');
  await expect(page.locator('#pago-banner')).toContainText('Pago cancelado');

  await page.goto('/portal/');
  await expect(page.locator('#pago-banner')).toBeEmpty();
});

test('mi-espacio.html and admin expose the new payment functions', async ({ page }) => {
  // MI/ADMIN son `const` de nivel superior en un <script> clásico: quedan
  // como identificadores globales (usables desde onclick="...") pero no como
  // propiedades de `window`, por eso se evalúan por nombre y no via globalThis.
  await page.goto('/portal/mi-espacio.html');
  const hasMi = await page.evaluate('typeof MI !== "undefined" && typeof MI.pagarAhora === "function"');
  expect(hasMi).toBe(true);

  await page.goto('/admin/');
  const hasAdmin = await page.evaluate('typeof ADMIN !== "undefined" && typeof ADMIN.generarLinkPago === "function"');
  expect(hasAdmin).toBe(true);
});
