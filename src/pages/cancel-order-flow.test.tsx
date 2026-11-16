// Ejercicio S4 · Parte C · La pantalla heredada cancela a través del caso de uso.
// La lista sigue llegando por src/services/api (heredado, simulado con vi.mock).
// La cancelación ya NO: entra por el módulo Pedidos que el test compone con adapters en memoria.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useEffect } from 'react';
import * as api from '../services/api';
import { AppStoreProvider, useAppStore } from '../store/appStore';
import type { Order, User } from '../shared/types';
import { createInMemoryAdapters, createOrdersModule, OrdersProvider, toOrder } from '../orders';
import OrdersPage from './OrdersPage';
import { ToastHost } from '../shell/ToastHost';

vi.mock('../services/api');

const MANAGER: User = { usr_id: 'u2', usr_nm: 'Pau', usr_role: 'manager' };
const HOTEL_BRISA: Order = { ord_id: 'P-1005', cust_nm: 'Hotel Brisa', cust_tier: 'silver', ord_st: 'pending', owner_id: 'u2', crt_ts: '2026-10-08T10:00:00Z', ln_items: [{ sku: 'A-10', qty: 10, unit_prc: 32.5 }] };

function SeedUser({ user }: { user: User }) {
  const { setUser } = useAppStore();
  useEffect(() => setUser(user), [setUser, user]);
  return null;
}

/** backendState: lo que tiene el backend AHORA. La pantalla carga la lista antes (puede estar desactualizada). */
function renderOrders(backendState: Order) {
  const adapters = createInMemoryAdapters([toOrder(backendState)]);
  render(
    <MemoryRouter>
      <AppStoreProvider>
        <OrdersProvider module={createOrdersModule(adapters)}>
          <SeedUser user={MANAGER} />
          <OrdersPage />
          <ToastHost />
        </OrdersProvider>
      </AppStoreProvider>
    </MemoryRouter>,
  );
  return adapters;
}

async function confirmCancellation(reason: string) {
  const row = (await screen.findByRole('button', { name: 'P-1005' })).closest('tr') as HTMLElement;
  fireEvent.click(within(row).getByRole('button', { name: 'Cancelar' }));
  fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: reason } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  return row;
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.getOrders).mockResolvedValue([HOTEL_BRISA]);
  vi.mocked(api.sendLog).mockResolvedValue(undefined);
});

afterEach(() => vi.restoreAllMocks());

describe('Parte C · cancelar desde la lista usa el caso de uso', () => {
  it('cancela en el backend, publica OrderCancelled, marca la fila y avisa; doAction ya no se usa', async () => {
    const adapters = renderOrders(HOTEL_BRISA);
    const row = await confirmCancellation('Cliente duplicado en el ERP');

    expect(await screen.findByText('Pedido cancelado')).toBeInTheDocument();
    expect(within(row).getByText('Cancelado')).toBeInTheDocument();
    expect((await adapters.gateway.findById('P-1005'))?.status).toBe('cancelled');
    expect(adapters.events.published).toEqual([expect.objectContaining({ type: 'OrderCancelled', orderId: 'P-1005', cancelledBy: 'u2' })]);
    expect(api.doAction).not.toHaveBeenCalled();
  });

  it('si el pedido ya se cerró en el backend, avisa con el mensaje del dominio y no toca la fila', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const adapters = renderOrders({ ...HOTEL_BRISA, ord_st: 'shipped' }); // la lista aún lo muestra pendiente
    const row = await confirmCancellation('Cliente duplicado en el ERP');

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Este pedido ya está cerrado y no se puede cancelar'));
    expect(within(row).getByText('Pendiente')).toBeInTheDocument();
    expect(adapters.events.published).toEqual([]);
    expect(screen.getByRole('dialog', { name: 'Cancelar pedido' })).toBeInTheDocument();
  });
});
