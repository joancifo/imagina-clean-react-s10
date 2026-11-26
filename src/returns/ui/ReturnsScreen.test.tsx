// Sesión 10 · Paso 5 · La pantalla NUEVA, probada como la usa una persona, con el fake del puerto.
// Los casos de «se conserva» repiten los valores de la caracterización de la heredada.
// Los de «cambio declarado» son los de docs/adr/008-devoluciones.md: { heredada, nueva }.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReturnsGatewayError, type ReturnsGateway } from '../application/ports';
import { createReturnsModule } from '../composition';
import type { ReturnableOrder } from '../domain/returnable-order';
import { at, CLASS_DAY, createInMemoryReturnsGateway, GOLD, IN_TRANSIT, P1004 } from '../testing';
import { ReturnsProvider } from './ReturnsProvider';
import { ReturnsScreen } from './ReturnsScreen';

function openScreen(orderId: string, { orders = [P1004, GOLD, IN_TRANSIT], role = 'manager', clock = CLASS_DAY, gateway }: { orders?: ReturnableOrder[]; role?: string; clock?: { now: () => Date }; gateway?: ReturnsGateway } = {}) {
  const fake = createInMemoryReturnsGateway({ orders, role, clock });
  const notices: string[] = [];
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[`/orders/${orderId}/returns`]}>
      <ReturnsProvider module={createReturnsModule({ returns: gateway ?? fake, clock })}>
        <Routes>
          <Route path="/orders/:id/returns" element={<ReturnsScreen orderId={orderId} role={role} onNotify={(message) => notices.push(message)} />} />
          <Route path="/orders/:id" element={<h1>Detalle del pedido</h1>} />
        </Routes>
      </ReturnsProvider>
    </MemoryRouter>,
  );
  return { user, fake, notices };
}

const heading = () => screen.findByRole('heading', { level: 1 });
const refund = () => (screen.getByText(/^Reembolso:/).textContent ?? '').replace(/\s+/g, ' ');
const quantity = () => screen.getByRole('spinbutton', { name: 'Cantidad' });
const submit = () => screen.getByRole('button', { name: 'Registrar devolución' });

describe('Devoluciones (nueva) · se conserva', () => {
  it('cabecera, subtítulo y lo que queda, como la heredada', async () => {
    openScreen('P-1004');
    expect(await heading()).toHaveTextContent('Devolución del pedido P-1004');
    expect(screen.getByText('Clínica Dental Mar · entregado el 12/11/2026 · seguimiento TRK-88412')).toBeInTheDocument();
    expect(screen.getByText('Ya devueltas: 1 · Puedes devolver hasta 2')).toBeInTheDocument();
  });

  it('148,40 € con reposición; defectuoso, 169,40 € sin ella', async () => {
    const { user } = openScreen('P-1004');
    await heading();
    expect(refund()).toBe('Reembolso: 148,40 €');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Motivo' }), 'DEFECTIVE');
    expect(refund()).toBe('Reembolso: 169,40 €');
    expect(screen.queryByText('Incluye gastos de reposición del 15 %')).not.toBeInTheDocument();
  });

  it('registrar: avisa, vuelve al detalle y envía qué y por qué, nunca el importe', async () => {
    const { user, fake, notices } = openScreen('P-1004');
    await heading();
    await user.click(submit());
    expect(await screen.findByRole('heading', { name: 'Detalle del pedido' })).toBeInTheDocument();
    expect(notices).toEqual(['Devolución registrada']);
    expect(fake.registered).toEqual([{ orderId: 'P-1004', sku: 'E-50', quantity: 1, reason: 'NO_LONGER_NEEDED' }]);
  });

  it('más de lo que queda: «Cantidad no válida» atado al campo, y no envía nada', async () => {
    const { user, fake } = openScreen('P-1004');
    await heading();
    await user.clear(quantity());
    await user.type(quantity(), '3');
    await user.click(submit());
    expect(screen.getByRole('alert')).toHaveTextContent('Cantidad no válida');
    expect(quantity()).toHaveAttribute('aria-invalid', 'true');
    expect(quantity()).toHaveAccessibleDescription('Cantidad no válida');
    expect(fake.registered).toEqual([]);
  });

  it('un manager por encima de 500 €: aviso y botón desactivado', async () => {
    const { user } = openScreen('P-2001');
    await heading();
    await user.clear(quantity());
    await user.type(quantity(), '5');
    expect(screen.getByText('Requiere aprobación de un administrador')).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it('no entregado y fuera de plazo: los mismos textos', async () => {
    openScreen('P-1002');
    expect(await screen.findByText('Este pedido todavía no se ha entregado.')).toBeInTheDocument();
  });

  it('el 12/12 a las 10:01 UTC: «Han pasado más de 30 días desde la entrega (12/11/2026).»', async () => {
    openScreen('P-1004', { clock: at('2026-12-12T10:01:00Z') });
    expect(await screen.findByText('Han pasado más de 30 días desde la entrega (12/11/2026).')).toBeInTheDocument();
  });
});

describe('Devoluciones (nueva) · cambios declarados (ADR-008)', () => {
  it('servidor sin respuesta al cargar: { heredada: «Cargando…» para siempre, nueva: error y Reintentar }', async () => {
    const fake = createInMemoryReturnsGateway({ orders: [P1004], role: 'manager', clock: CLASS_DAY });
    let calls = 0;
    const flaky: ReturnsGateway = { ...fake, loadReturnable: (id) => (++calls === 1 ? Promise.reject(new ReturnsGatewayError('unavailable')) : fake.loadReturnable(id)) };
    const { user } = openScreen('P-1004', { gateway: flaky });
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido cargar la devolución. Inténtalo de nuevo en unos segundos');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await heading()).toHaveTextContent('Devolución del pedido P-1004');
  });

  it('servidor sin respuesta al registrar: { heredada: «Error 500», nueva: un mensaje que se entiende, y se puede reintentar }', async () => {
    const fake = createInMemoryReturnsGateway({ orders: [P1004], role: 'manager', clock: CLASS_DAY });
    const { user } = openScreen('P-1004', { gateway: { ...fake, register: () => Promise.reject(new ReturnsGatewayError('unavailable')) } });
    await heading();
    await user.click(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido registrar la devolución. Inténtalo de nuevo en unos segundos');
    expect(submit()).toBeEnabled();
  });
});
