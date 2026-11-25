// Sesión 9 · Tema 20 · Configuración de Playwright para OrderDesk.
// Documentación: https://playwright.dev/docs/test-configuration · https://playwright.dev/docs/test-webserver
import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);
const BFF_PORT = 3101; // server/e2e.mjs · distinto del 3001 de `npm run dev`
const WEB_PORT = 5174; // distinto del 5173 de `npm run dev`

export default defineConfig({
  // En CI, `test.only` olvidado = fallo. En local, nadie te lo impide.
  forbidOnly: CI,
  // Un reintento en CI para CAPTURAR la traza, no para esconder el fallo: un test que pasa
  // al segundo intento aparece como «flaky» en el informe, y eso también se revisa.
  retries: CI ? 2 : 0,
  // Todos los tests comparten UN BFF con datos en memoria: en paralelo, uno cancelaría el pedido
  // que otro está aprobando. Cada test empieza con los datos de partida (e2e/fixtures.ts),
  // y los ejecuta un solo worker. Paralelizar exige un BFF por worker: ver docs/adr/007.
  workers: 1,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  // Que un fallo en CI deje informe aunque se cuelgue: tope global para todo el lote.
  globalTimeout: CI ? 10 * 60 * 1000 : undefined,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },
  projects: [
    // Los journeys del producto: lo que corre en CI.
    { name: 'e2e', testDir: './e2e', use: { ...devices['Desktop Chrome'] } },
    // Los ejemplos de la clase (examples/tema20): `npm run demo:tema20`.
    { name: 'demo', testDir: './examples/tema20', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      name: 'bff',
      command: 'node server/e2e.mjs',
      // Un 401 cuenta como «arrancado» para Playwright: /api/me sin cookie responde 401.
      url: `http://localhost:${BFF_PORT}/api/me`,
      reuseExistingServer: !CI,
      env: { E2E_BFF_PORT: String(BFF_PORT) },
    },
    {
      name: 'web',
      // En CI se prueba lo que se despliega (el build); en local, el servidor de desarrollo, que arranca antes.
      command: CI ? `npx vite build && npx vite preview --port ${WEB_PORT} --strictPort` : `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !CI,
      timeout: 120 * 1000,
      env: { BFF_URL: `http://localhost:${BFF_PORT}` },
    },
  ],
});
