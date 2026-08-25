import { test as base, expect, type Page } from '@playwright/test';

/**
 * Corta todo lo que no sea del propio sitio: Font Awesome, Google Fonts,
 * Supabase, analítica. Los e2e comprueban nuestro HTML, no la disponibilidad
 * de un CDN, y esas peticiones retrasan DOMContentLoaded de forma
 * impredecible (en un entorno sin salida a internet, muchísimo).
 */
export async function soloLocal(page: Page) {
  await page.route('**/*', route => {
    const host = new URL(route.request().url()).host;
    return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
      ? route.continue()
      : route.abort();
  });
}

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await soloLocal(page);
    await use(page);
  },
});

export { expect };
