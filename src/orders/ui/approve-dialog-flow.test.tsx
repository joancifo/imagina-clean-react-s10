// Ejercicio S6 · Parte B · El formulario de aprobación en la pantalla: justificar, corregir y reintentar.
// Sin red: el módulo se compone con adapters en memoria, como en la Sesión 5.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createInMemoryAdapters, createOrdersModule, type OrdersAdapters } from '../composition';
import { OrderGatewayError, type GatewayFailure } from '../application/ports';
import type { Actor } from '../domain/cancellation';
import type { Order } from '../domain/order';
import { OrdersListPage } from './OrdersListPage';
import { OrdersProvider } from './OrdersProvider';

const order = (id: string, unitPrice: number): Order => ({
  id, customerName: 'Construcciones Vega', customerTier: 'standard', status: 'pending', ownerId: 'u2',
  createdAt: '2026-11-19T10:00:00Z', lines: [{ sku: 'A-10', quantity: 1, unitPrice }],
});

const CORRIENTE = order('P-1', 300); //   363 € · por debajo de 3000 €: no hace falta justificar
const URGENTE = order('P-9', 4000); //   4840 € · urgente: el dominio pide justificación
const ADMIN: Actor = { id: 'u1', role: 'admin' };

/** Un adapter que falla al aprobar con el fallo que se le pida: así se prueban los caminos de error. */
const failingWith = (failure: GatewayFailure, adapters: OrdersAdapters): OrdersAdapters => ({
  ...adapters,
  gateway: { ...adapters.gateway, approve: async () => { throw new OrderGatewayError(failure); } },
});

function renderList(adapters: OrdersAdapters) {
  const onNotify = vi.fn();
  render(
    <MemoryRouter initialEntries={['/']}>
      <OrdersProvider module={createOrdersModule(adapters)}>
        <Routes>
          <Route path="/" element={<OrdersListPage actor={ADMIN} onNotify={onNotify} />} />
          <Route path="/orders/:id" element={<h1>Detalle del pedido</h1>} />
        </Routes>
      </OrdersProvider>
    </MemoryRouter>,
  );
  return { onNotify };
}

const clickApprove = async (id: string) => {
  const row = (await screen.findByRole('button', { name: id })).closest('tr') as HTMLElement;
  fireEvent.click(within(row).getByRole('button', { name: 'Aprobar' }));
};
const dialog = () => screen.findByRole('dialog', { name: 'Aprobar pedido' });

describe('Parte B · cuándo aparece el diálogo', () => {
  it('un pedido corriente se aprueba de un clic: la pantalla no inventa ceremonia', async () => {
    const { onNotify } = renderList(createInMemoryAdapters([CORRIENTE]));
    await clickApprove('P-1');
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Pedido P-1 aprobado'));
    expect(screen.queryByRole('dialog', { name: 'Aprobar pedido' })).toBeNull();
  });

  it('un pedido urgente abre el diálogo y todavía NO se aprueba', async () => {
    const adapters = createInMemoryAdapters([URGENTE]);
    const { onNotify } = renderList(adapters);
    await clickApprove('P-9');
    expect(await dialog()).toBeInTheDocument();
    expect(onNotify).not.toHaveBeenCalled();
    expect((await adapters.reader.findAll())[0].status).toBe('pending');
  });
});

describe('Parte B · el formulario corrige antes de llamar a nadie', () => {
  it('confirmar en vacío enseña los DOS errores y no cierra el diálogo', async () => {
    const adapters = createInMemoryAdapters([URGENTE]);
    renderList(adapters);
    await clickApprove('P-9');
    fireEvent.click(within(await dialog()).getByRole('button', { name: 'Confirmar aprobación' }));
    const alerts = within(await dialog()).getAllByRole('alert').map((node) => node.textContent);
    expect(alerts).toEqual(['Escribe por qué apruebas este pedido', 'Confirma que has revisado el importe']);
    expect((await adapters.reader.findAll())[0].status).toBe('pending');
  });

  it('al corregir el campo, el error desaparece y la aprobación sale adelante', async () => {
    const adapters = createInMemoryAdapters([URGENTE]);
    const { onNotify } = renderList(adapters);
    await clickApprove('P-9');
    fireEvent.click(within(await dialog()).getByRole('button', { name: 'Confirmar aprobación' }));
    fireEvent.change(within(await dialog()).getByLabelText('Justificación'), { target: { value: 'Riesgo revisado con el cliente' } });
    fireEvent.click(within(await dialog()).getByRole('checkbox'));
    fireEvent.change(within(await dialog()).getByLabelText('Canal'), { target: { value: 'phone' } });
    fireEvent.click(within(await dialog()).getByRole('button', { name: 'Confirmar aprobación' }));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Pedido P-9 aprobado'));
  });

  it('el evento publicado lleva el canal y si hubo nota, pero NUNCA el texto de la nota', async () => {
    const adapters = createInMemoryAdapters([URGENTE]);
    renderList(adapters);
    await clickApprove('P-9');
    fireEvent.change(within(await dialog()).getByLabelText('Justificación'), { target: { value: 'Pau confirma por teléfono con el cliente' } });
    fireEvent.click(within(await dialog()).getByRole('checkbox'));
    fireEvent.change(within(await dialog()).getByLabelText('Canal'), { target: { value: 'phone' } });
    fireEvent.click(within(await dialog()).getByRole('button', { name: 'Confirmar aprobación' }));
    const events = adapters.events as unknown as { published: Record<string, unknown>[] };
    await waitFor(() => expect(events.published).toHaveLength(1));
    expect(events.published[0]).toMatchObject({ type: 'OrderApproved', channel: 'phone', hasNote: true });
    expect(JSON.stringify(events.published[0])).not.toMatch(/teléfono con el cliente/);
  });
});

describe('Parte B · errores del servidor', () => {
  it('«no hay servidor» se puede reintentar', async () => {
    renderList(failingWith('unavailable', createInMemoryAdapters([CORRIENTE])));
    await clickApprove('P-1');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No hay conexión con el servidor');
    expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('«no puedes» NO se reintenta: reintentar no cambia el permiso', async () => {
    renderList(failingWith('forbidden', createInMemoryAdapters([CORRIENTE])));
    await clickApprove('P-1');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No tienes permisos para aprobar');
    expect(within(alert).queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });
});
