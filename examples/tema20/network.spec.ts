// Tema 20 · Controlar la red dentro de un E2E: page.route().
// Úsalo cuando el JOURNEY trata del fallo (el usuario reintenta y sale bien). Para comprobar cada código
// de estado está MSW en los tests de integración (Sesión 8): son milisegundos, no segundos.
// Documentación: https://playwright.dev/docs/network
import { expect, test } from '../../e2e/fixtures';

// Aquí no se usa la fixture signIn: espera a ver la lista, y este test empieza justo con la lista rota.
test('si el BFF falla al cargar, «Reintentar» recupera la lista', async ({ page }) => {
  let failing = true;
  await page.route('**/api/orders', (route) =>
    failing ? route.fulfill({ status: 503, json: { error: { code: 'unavailable' } } }) : route.continue(),
  );

  await page.goto('/');
  await page.getByRole('region', { name: 'Entrar' }).getByRole('button', { name: 'Pau (manager)' }).click();
  await expect(page.getByRole('alert')).toHaveText('No se pudieron cargar los pedidos');

  failing = false; // el servicio se recupera
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('row')).toHaveCount(7);
});
