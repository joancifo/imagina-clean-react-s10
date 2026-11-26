// Ejercicio S9 · Parte A · El journey de cancelar un pedido, de punta a punta.
// Pautas en docs/ejercicio-s9.md. Modelo a seguir: e2e/approve-urgent.spec.ts.
import { expect, rowOf, test } from './fixtures';

test.describe('Cancelar un pedido', () => {
  test('un manager cancela un pedido pendiente y la cancelación sobrevive a recargar la página', async ({ page, signIn }) => {
    await signIn('Pau (manager)');
    const row = rowOf(page, 'P-1005');

    // Paso 1 · «Cancelar» DENTRO de la fila: en la página hay varios.
    await row.getByRole('button', { name: 'Cancelar' }).click();

    // Paso 2 · Motivo y confirmación, buscados DENTRO del diálogo.
    const dialog = page.getByRole('dialog', { name: 'Cancelar pedido' });
    await dialog.getByRole('textbox', { name: 'Motivo' }).fill('Cliente duplicado en el ERP');
    await dialog.getByRole('button', { name: 'Confirmar' }).click();

    // Paso 3 · Lo que ve la persona: el aviso, la fila cancelada y sin botón de cancelar.
    await expect(page.getByRole('status')).toHaveText('Pedido cancelado');
    await expect(dialog).toBeHidden();
    await expect(row).toContainText('Cancelado');
    await expect(row.getByRole('button', { name: 'Cancelar' })).toHaveCount(0);

    // Paso 4 · Recargar: si sigue cancelado, lo ha guardado el SERVIDOR, no el estado de React.
    await page.reload();
    await expect(rowOf(page, 'P-1005')).toContainText('Cancelado');
  });

  test('si otra persona lo cancela mientras lo miras, el diálogo lo explica y no finge el éxito', async ({ page, signIn, backstage }) => {
    await signIn('Pau (manager)');
    const row = rowOf(page, 'P-1005');
    await expect(row).toContainText('Pendiente'); // la pantalla, cargada ANTES del cambio

    // Paso 5 · Marta lo cancela por detrás. La lista de Pau no se entera: sigue diciendo «Pendiente».
    await backstage.cancel('P-1005');

    await row.getByRole('button', { name: 'Cancelar' }).click();
    const dialog = page.getByRole('dialog', { name: 'Cancelar pedido' });
    await dialog.getByRole('textbox', { name: 'Motivo' }).fill('Cliente duplicado en el ERP');
    await dialog.getByRole('button', { name: 'Confirmar' }).click();

    // Paso 6 · El servidor dice que no, y la pantalla lo cuenta: alerta en el diálogo y ningún aviso de éxito.
    await expect(dialog.getByRole('alert')).toHaveText('Este pedido ya está cerrado y no se puede cancelar');
    await expect(page.getByRole('status')).toHaveCount(0);
  });
});
