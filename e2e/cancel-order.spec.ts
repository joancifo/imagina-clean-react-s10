// Ejercicio S9 · Parte A · El journey de cancelar un pedido, de punta a punta.
// Pautas en docs/ejercicio-s9.md. Modelo a seguir: e2e/approve-urgent.spec.ts.
// 1. Cambia los dos `test.fixme(` por `test(`.   2. Escribe cada PASO debajo de su comentario.
import { expect, rowOf, test } from './fixtures';

test.describe('Cancelar un pedido', () => {
  test.fixme('un manager cancela un pedido pendiente y la cancelación sobrevive a recargar la página', async ({ page, signIn }) => {
    await signIn('Pau (manager)');
    const row = rowOf(page, 'P-1005');

    // PASO 1 · Pulsa «Cancelar» DENTRO de la fila: en la página hay dos.
    //          Pista: row.getByRole('button', { name: … }).click()

    // PASO 2 · El diálogo, por su nombre accesible («Cancelar pedido»). Dentro de él:
    //          escribe «Cliente duplicado en el ERP» en «Motivo» y pulsa «Confirmar».
    //          Pista: const dialog = page.getByRole('dialog', { name: … });
    //                 dialog.getByRole('textbox', { name: … }).fill(…) · dialog.getByRole('button', { name: … }).click()

    // PASO 3 · Lo que ve la persona, con aserciones web-first (await expect(locator)…):
    //          · el aviso (rol status) dice «Pedido cancelado»   → toHaveText
    //          · el diálogo se ha cerrado                         → toBeHidden
    //          · la fila dice «Cancelado»                         → toContainText
    //          · la fila ya no tiene botón «Cancelar»             → toHaveCount(0)

    // PASO 4 · Recarga la página y comprueba que la fila del P-1005 SIGUE diciendo «Cancelado».
    //          Pista: page.reload() y vuelve a pedir la fila con rowOf(…).
    void row;
  });

  test.fixme('si otra persona lo cancela mientras lo miras, el diálogo lo explica y no finge el éxito', async ({ page, signIn, backstage }) => {
    await signIn('Pau (manager)');
    const row = rowOf(page, 'P-1005');
    await expect(row).toContainText('Pendiente'); // la pantalla, cargada ANTES del cambio

    // PASO 5 · Marta cancela el P-1005 por detrás (API, con su propia sesión). La lista de Pau no se entera.
    //          Pista: await backstage.cancel('P-1005');
    //          Después, repite los PASOS 1 y 2: Pau intenta cancelarlo desde su pantalla.

    // PASO 6 · El servidor dice que no, y la pantalla lo cuenta:
    //          · dentro del diálogo, la alerta dice «Este pedido ya está cerrado y no se puede cancelar»
    //          · NO hay aviso de éxito: page.getByRole('status') → toHaveCount(0)
    void backstage;
  });
});
