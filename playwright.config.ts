import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    // El intro de marca se salta con prefers-reduced-motion, igual que para
    // un visitante que pide menos movimiento. Los tests del intro lo activan.
    reducedMotion: 'reduce',
  },
  webServer: {
    // El sitio es Jekyll (páginas con front matter + layouts/includes), así
    // que hay que construirlo antes de servirlo — servir el repo crudo
    // mostraría el "---" y los "{% include %}" sin procesar.
    command: 'bundle exec jekyll build --destination _site && python3 -m http.server 8080 --directory _site',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
