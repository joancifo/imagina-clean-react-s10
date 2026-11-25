// Arranque del BFF para los tests E2E (Sesión 9 · Tema 20). Lo lanza Playwright (playwright.config.ts → webServer).
// Diferencias con server/index.mjs, y ninguna más:
//   1. Otro puerto (3101): unos E2E no deben reutilizar por accidente el `npm run dev` que tienes abierto.
//   2. `testing: true`: expone POST /api/testing/reset para empezar cada test con los datos de partida.
// Nunca en producción: si NODE_ENV dice «production», no arranca.
import { createBff } from './bff.mjs';

if (process.env.NODE_ENV === 'production') {
  console.error('server/e2e.mjs expone un reinicio de datos: no se arranca con NODE_ENV=production.');
  process.exit(1);
}

const port = Number(process.env.E2E_BFF_PORT ?? 3101);
createBff({ testing: true }).listen(port, () => console.log(`BFF de pruebas E2E en http://localhost:${port}`));
