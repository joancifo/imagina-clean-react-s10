// Sesión 9 · Tema 20 · Fixtures de los E2E de OrderDesk. Úsalas así:
//   import { expect, rowOf, test } from './fixtures';
//
// Qué resuelven, y por qué aquí y no en cada test:
//   · resetData (automática): cada test empieza con los pedidos de partida. Sin ella, el resultado
//     depende del ORDEN en que se ejecutan los tests, y eso es la definición de un test frágil.
//   · signIn: entrar como lo hace una persona (pulsando su nombre), no escribiendo una cookie a mano.
//   · backstage: otra persona actuando a la vez, por la API y con SU sesión. Sirve para preparar
//     situaciones que la pantalla sola no puede provocar (el pedido que alguien cancela mientras lo miras).
//   · rowOf: la fila de un pedido, encontrada por lo que se VE (el botón con su código), no por la posición.
import { test as base, expect, type Locator, type Page } from '@playwright/test';

/** Los tres usuarios de formación, tal como aparecen en la barra de entrada. */
export type UserButton = 'Marta (admin)' | 'Pau (manager)' | 'Iris (agente)';

/** Lo que hace «otra persona» por detrás de la pantalla. */
export type Backstage = {
  /** Cancela un pedido por la API con la sesión de otro usuario (por defecto, Marta: admin). */
  cancel: (orderId: string, userId?: 'u1' | 'u2') => Promise<void>;
};

type Fixtures = {
  resetData: void;
  signIn: (who: UserButton) => Promise<void>;
  backstage: Backstage;
};

export const test = base.extend<Fixtures>({
  resetData: [
    async ({ request }, use) => {
      // Mismo origen que la página: la petición pasa por el proxy de Vite hasta server/e2e.mjs.
      const response = await request.post('/api/testing/reset');
      expect(response.status(), 'el BFF de pruebas no ha reiniciado los datos (¿es server/e2e.mjs?)').toBe(204);
      await use();
    },
    { auto: true },
  ],

  signIn: async ({ page }, use) => {
    await use(async (who) => {
      await page.goto('/');
      await page.getByRole('region', { name: 'Entrar' }).getByRole('button', { name: who }).click();
      // Aserción web-first: espera hasta 5 s a que aparezca. Ni waitForTimeout ni sleep.
      await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible();
    });
  },

  backstage: async ({ playwright, baseURL }, use) => {
    // Un contexto de peticiones PROPIO: sus cookies no se mezclan con las de la página.
    const api = await playwright.request.newContext({ baseURL });
    await use({
      async cancel(orderId, userId = 'u1') {
        await api.post('/api/session', { data: { userId } });
        const response = await api.post(`/api/orders/${orderId}/cancel`, { data: { reason: 'Cancelado desde otra sesión' } });
        expect(response.status(), `no se ha podido cancelar ${orderId} por detrás`).toBe(200);
      },
    });
    await api.dispose();
  },
});

/** La fila de la tabla de pedidos que contiene el botón con el código del pedido. */
export function rowOf(page: Page, orderId: string): Locator {
  return page.getByRole('row').filter({ has: page.getByRole('button', { name: orderId, exact: true }) });
}

export { expect };
