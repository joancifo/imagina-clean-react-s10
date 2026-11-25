// Sesión 9 · Tema 20 · Smoke: la aplicación arranca, se puede entrar y la lista carga desde el BFF.
// Es el test que se ejecuta tras CADA despliegue (`npm run test:e2e:smoke`): treinta segundos que dicen
// «está viva», no «está bien». Lo que está bien lo dicen los otros 600 tests.
import { expect, test } from './fixtures';

test('se entra como manager y se ven los seis pedidos de partida', { tag: '@smoke' }, async ({ page, signIn }) => {
  await signIn('Pau (manager)');

  // 1 fila de cabecera + 6 pedidos
  await expect(page.getByRole('row')).toHaveCount(7);
  await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
});
