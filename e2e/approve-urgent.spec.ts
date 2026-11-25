// Sesión 9 · Tema 20 · Journey de referencia: aprobar un pedido urgente.
// Léelo antes del ejercicio: tiene todo lo que vas a necesitar.
//
// Por qué ESTE flujo merece un E2E (y casi ningún otro): cruza todas las capas a la vez.
//   pantalla ─▶ diálogo con formulario ─▶ caso de uso ─▶ adapter HTTP ─▶ BFF (autoriza) ─▶ navegación al detalle
// Cada pieza tiene ya sus tests. Lo que ninguno de ellos comprueba es que, ENCHUFADAS, funcionan.
import { expect, rowOf, test } from './fixtures';

test.describe('Aprobar un pedido urgente', () => {
  test('pide justificación, aprueba y abre el detalle para revisarlo', async ({ page, signIn }) => {
    await signIn('Pau (manager)');

    // 1 · Actuar DENTRO de la fila: en la página hay tres botones «Aprobar».
    await rowOf(page, 'P-1003').getByRole('button', { name: 'Aprobar' }).click();

    // 2 · Todo lo que sigue ocurre en el diálogo: se busca DENTRO de él, por su nombre accesible.
    const dialog = page.getByRole('dialog', { name: 'Aprobar pedido' });
    await dialog.getByRole('textbox', { name: 'Justificación' }).fill('Cliente gold con entrega comprometida');
    await dialog.getByRole('checkbox', { name: 'He revisado el importe' }).check();
    await dialog.getByRole('combobox', { name: 'Canal' }).selectOption('Teléfono');
    await dialog.getByRole('button', { name: 'Confirmar aprobación' }).click();

    // 3 · Resultado que ve la persona: aviso, URL del detalle y estado. Aserciones web-first: reintentan solas.
    await expect(page.getByRole('status')).toHaveText('Pedido P-1003 aprobado');
    await expect(page).toHaveURL('/orders/P-1003');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Aprobado');
  });

  // Lo que NO está aquí, a propósito: «sin justificación no aprueba», «el importe hay que revisarlo»…
  // Son reglas de un formulario y ya las prueban approval-form.test.ts y ApproveDialog.test.tsx en
  // milisegundos. Un E2E por cada mensaje de error es una suite lenta que nadie quiere ejecutar.
});
