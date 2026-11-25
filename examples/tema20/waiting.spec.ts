// Tema 20 · Esperas: la causa número uno de los E2E intermitentes.
// Las aserciones «web-first» (await expect(locator).toX()) reintentan hasta que se cumplen o vence
// el tiempo (5 s por defecto). Leer un valor y compararlo después (expect(await …)) no reintenta nada.
// Documentación: https://playwright.dev/docs/test-assertions · https://playwright.dev/docs/actionability
import type { Page } from '@playwright/test';
import { expect, rowOf, test } from '../../e2e/fixtures';

/** Un BFF lento solo para cancelar: la respuesta tarda 800 ms en llegar. */
async function slowCancel(page: Page) {
  await page.route('**/api/orders/*/cancel', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
}

async function cancelP1005(page: Page) {
  await rowOf(page, 'P-1005').getByRole('button', { name: 'Cancelar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cancelar pedido' });
  await dialog.getByRole('textbox', { name: 'Motivo' }).fill('Cliente duplicado en el ERP');
  await dialog.getByRole('button', { name: 'Confirmar' }).click();
}

test('aserción web-first: espera a que la pantalla cambie, sin pausas a mano', async ({ page, signIn }) => {
  await signIn('Pau (manager)');
  await slowCancel(page);
  await cancelP1005(page);

  await expect(rowOf(page, 'P-1005')).toContainText('Cancelado');
});

test('leer y comparar después NO espera: falla con la red lenta', async ({ page, signIn }) => {
  test.fail(); // marcado: SABEMOS que falla, y el informe lo dirá si un día deja de fallar
  await signIn('Pau (manager)');
  await slowCancel(page);
  await cancelP1005(page);

  // textContent() lee el texto UNA vez, en este instante: todavía dice «Pendiente».
  expect(await rowOf(page, 'P-1005').textContent()).toContain('Cancelado');
});

// Y la «solución» que sí funciona… hasta que el servidor de CI va más lento que tu portátil:
//   await page.waitForTimeout(1000);
// La documentación de Playwright lo desaconseja para tests de verdad: es una pausa fija, no una condición.
