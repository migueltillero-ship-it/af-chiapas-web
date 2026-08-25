import { test, expect } from '@playwright/test';

test.describe('Campaña de relanzamiento', () => {
  test('el hero de relanzamiento anuncia el nuevo ciclo', async ({ page }) => {
    await page.goto('/?nointro=1');
    const relanz = page.locator('#relanzamiento');
    await relanz.scrollIntoViewIfNeeded();
    await expect(relanz).toBeVisible();
    await expect(relanz.locator('.relanz-sub')).toContainText(/15 de septiembre/i);
  });

  test('la cuenta regresiva se rellena con números', async ({ page }) => {
    await page.goto('/?nointro=1');
    await page.locator('#countdown').scrollIntoViewIfNeeded();
    // El JS reemplaza los guiones iniciales; si el ciclo ya arrancó muestra un aviso.
    await expect(page.locator('#countdown')).not.toContainText('–');
  });

  test('el calendario publica seis ciclos y abre el primero', async ({ page }) => {
    await page.goto('/?nointro=1');
    await page.locator('#calendario').scrollIntoViewIfNeeded();
    await expect(page.locator('#calendario tbody tr')).toHaveCount(6);
    await expect(page.locator('#calendario tbody tr.destacado .cal-badge')).toContainText(/Abiertas ahora/i);
  });

  test('las secciones de bienvenida, docentes y promos están presentes', async ({ page }) => {
    await page.goto('/?nointro=1');
    for (const id of ['#bienvenida', '#docentes-online', '#promociones']) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await expect(page.locator(id)).toBeVisible();
    }
    await expect(page.locator('#promociones .promo-card')).toHaveCount(3);
  });

  test('el aviso deja claro que preparamos pero no certificamos', async ({ page }) => {
    await page.goto('/?nointro=1');
    const aviso = page.locator('.aviso-prep');
    await aviso.scrollIntoViewIfNeeded();
    await expect(aviso.locator('.aviso-prep-t')).toContainText(/No lo aplicamos/i);
    await expect(aviso.locator('.aviso-prep-d')).toContainText(/centro de preparación/i);
    await expect(aviso.locator('.aviso-prep-d')).toContainText(/centro evaluador acreditado/i);
  });
});
