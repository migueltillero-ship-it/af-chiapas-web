import { test, expect } from './fixtures';

test.describe('Campaña de relanzamiento', () => {
  test('publica las dos fechas oficiales: atención el 5 y clases el 15', async ({ page }) => {
    await page.goto('/');
    const facts = page.locator('#relanzamiento .relanz-facts');
    await facts.scrollIntoViewIfNeeded();
    await expect(facts).toContainText(/Atención al público/i);
    await expect(facts).toContainText(/5 de septiembre/i);
    await expect(facts).toContainText(/Inicio de clases/i);
    await expect(facts).toContainText(/15 de septiembre/i);
  });

  test('avisa de que se responde a partir del 5 de septiembre', async ({ page }) => {
    await page.goto('/');
    // El aviso se retira solo cuando llega la fecha; antes debe estar.
    const yaAbrio = await page.evaluate(() => Date.now() >= Date.parse('2026-09-05T09:00:00-06:00'));
    const aviso = page.locator('#aviso-atencion');
    if (yaAbrio) {
      await expect(aviso).toHaveCount(0);
    } else {
      await expect(aviso).toContainText(/5 de septiembre/i);
      await expect(aviso).toContainText(/preinscripción/i);
    }
  });

  test('el hero de relanzamiento anuncia el nuevo ciclo', async ({ page }) => {
    await page.goto('/');
    const relanz = page.locator('#relanzamiento');
    await relanz.scrollIntoViewIfNeeded();
    await expect(relanz).toBeVisible();
    await expect(relanz.locator('.relanz-sub')).toContainText(/15 de septiembre/i);
  });

  test('la cuenta regresiva se rellena con números', async ({ page }) => {
    await page.goto('/');
    await page.locator('#countdown').scrollIntoViewIfNeeded();
    // El JS reemplaza los guiones iniciales; si el ciclo ya arrancó muestra un aviso.
    await expect(page.locator('#countdown')).not.toContainText('–');
  });

  test('el calendario publica seis ciclos y abre el primero', async ({ page }) => {
    await page.goto('/');
    await page.locator('#calendario').scrollIntoViewIfNeeded();
    await expect(page.locator('#calendario tbody tr')).toHaveCount(6);
    await expect(page.locator('#calendario tbody tr.destacado .cal-badge')).toContainText(/Abiertas ahora/i);
  });

  test('las secciones de bienvenida, docentes y promos están presentes', async ({ page }) => {
    await page.goto('/');
    for (const id of ['#bienvenida', '#docentes-online', '#promociones']) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await expect(page.locator(id)).toBeVisible();
    }
    await expect(page.locator('#promociones .promo-card')).toHaveCount(3);
  });

  test('el aviso deja claro que preparamos pero no certificamos', async ({ page }) => {
    await page.goto('/');
    const aviso = page.locator('.aviso-prep');
    await aviso.scrollIntoViewIfNeeded();
    await expect(aviso.locator('.aviso-prep-t')).toContainText(/No lo aplicamos/i);
    await expect(aviso.locator('.aviso-prep-d')).toContainText(/centro de preparación/i);
    await expect(aviso.locator('.aviso-prep-d')).toContainText(/centro evaluador acreditado/i);
  });
});
