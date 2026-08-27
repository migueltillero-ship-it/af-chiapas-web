import { test, expect } from './fixtures';

// El intro de bienvenida es un overlay modal que interceptaría los clics.
// Se cierra solo cuando el visitante pide menos movimiento, así que entramos
// por esa puerta —la misma condición que usa el propio index.html.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('Le parcours · escalera MCER', () => {
  test('publica los seis niveles en orden A1 → C2', async ({ page }) => {
    await page.goto('/');
    const niveles = page.locator('#parcours-ladder .niv');
    await expect(niveles).toHaveCount(6);
    await expect(niveles.locator('.niv-code')).toHaveText(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  test('cada nivel arranca plegado y accesible', async ({ page }) => {
    await page.goto('/');
    const btns = page.locator('#parcours-ladder .niv-btn');
    await expect(btns).toHaveCount(6);
    for (const b of await btns.all()) {
      await expect(b).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('al abrir un nivel muestra su diploma y duración de examen', async ({ page }) => {
    await page.goto('/');
    const a1 = page.locator('#parcours-ladder .niv[data-nivel="A1"]');
    await a1.locator('.niv-btn').click();
    await expect(a1.locator('.niv-btn')).toHaveAttribute('aria-expanded', 'true');
    await expect(a1).toContainText('DELF A1');
    await expect(a1).toContainText('1h 20min');
  });

  test('el nivel se vuelve a plegar al pulsarlo de nuevo', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#parcours-ladder .niv[data-nivel="B2"] .niv-btn');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('C1 y C2 declaran carga variable, no una cifra inventada', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.niv[data-nivel="C1"] .niv-hrs')).toContainText(/variable/i);
    await expect(page.locator('.niv[data-nivel="C2"] .niv-hrs')).toContainText(/variable/i);
  });

  test('el menú enlaza a la sección', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nav-drop a[href="#parcours"]')).toHaveCount(1);
  });
});

test.describe('Evidencias de calidad', () => {
  test('publica los resultados reales del JSON de DELF', async ({ page }) => {
    await page.goto('/');
    const evid = page.locator('#evidencias');
    await expect(evid).toBeVisible();
    await expect(evid).toContainText('100');
    await expect(evid).toContainText(/DELF Junior/i);
    await expect(page.locator('#evid-grid .evid-card')).toHaveCount(3);
  });

  test('la nota cita la fuente institucional', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#evid-note')).toContainText(/Alliance Française San Cristóbal/i);
  });

  test('queda oculta si no hay datos publicables', async ({ page }) => {
    // Sin resultados_historicos la sección no debe inventar nada.
    await page.route('**/delf_dalf.json', r => r.fulfill({ status: 200, body: '{}' }));
    await page.goto('/');
    await expect(page.locator('#parcours-ladder .niv')).toHaveCount(6);
    await expect(page.locator('#evidencias')).toBeHidden();
  });
});
