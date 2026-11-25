// Tema 20 · Localizadores: buscar como una persona también en el navegador real.
// Mismo criterio que React Testing Library (Sesión 8), con la misma escalera:
//   getByRole > getByLabel > getByPlaceholder > getByText > getByTestId > CSS / XPath
// Documentación: https://playwright.dev/docs/locators · https://playwright.dev/docs/best-practices
import { expect, rowOf, test } from '../../e2e/fixtures';

test('los dos localizadores encuentran hoy la misma fila', async ({ page, signIn }) => {
  await signIn('Pau (manager)');

  const byPosition = page.locator('table tbody tr:nth-child(5)'); // lo que graba un grabador ingenuo
  const byMeaning = rowOf(page, 'P-1005'); // lo que buscaría una persona: «la fila del P-1005»

  await expect(byPosition).toContainText('P-1005');
  await expect(byMeaning).toContainText('P-1005');
});

test('la posición miente en cuanto alguien ordena la tabla', async ({ page, signIn }) => {
  await signIn('Pau (manager)');
  await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('Importe');

  // El selector CSS sigue «funcionando»: encuentra una fila. Pero ya no es la del P-1005.
  await expect(page.locator('table tbody tr:nth-child(5)')).not.toContainText('P-1005');
  // El localizador por significado no se ha enterado del cambio, que es exactamente lo que queremos.
  await expect(rowOf(page, 'P-1005')).toContainText('Hotel Brisa');
});

test('modo estricto: un localizador ambiguo falla en vez de elegir por ti', async ({ page, signIn }) => {
  await signIn('Pau (manager)');

  // Hay varios «Cancelar» en la página. Playwright no pulsa «el primero»: avisa de que hay más de uno.
  const anyCancel = page.getByRole('button', { name: 'Cancelar' });
  await expect(anyCancel).toHaveCount(2); // P-1001 y P-1005: los pendientes que un manager puede cancelar
  await expect(anyCancel.click({ timeout: 1000 })).rejects.toThrow(/strict mode violation/);

  // La salida no es .first(): es acotar al contexto que da sentido al botón.
  await expect(rowOf(page, 'P-1005').getByRole('button', { name: 'Cancelar' })).toHaveCount(1);
});
