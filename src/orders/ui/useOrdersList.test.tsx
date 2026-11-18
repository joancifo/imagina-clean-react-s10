// Ejercicio S5 · Parte C · El hook de datos carga la lista con el caso de uso y gestiona recargas.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { OrdersModule } from '../composition';
import type { Order } from '../domain/order';
import { OrdersProvider } from './OrdersProvider';
import { useOrdersList } from './useOrdersList';

const anOrder = (id: string): Order => ({ id, customerName: 'Cliente', customerTier: 'standard', status: 'pending', ownerId: 'u2', createdAt: '2026-11-18T10:00:00Z', lines: [] });

/** Cada llamada a listOrders devuelve una promesa que el test resuelve o rechaza cuando quiere. */
function setup() {
  const requests: { resolve: (orders: Order[]) => void; reject: (error: Error) => void }[] = [];
  const listOrders = vi.fn(() => new Promise<Order[]>((resolve, reject) => { requests.push({ resolve, reject }); }));
  const module = { listOrders } as unknown as OrdersModule; // el hook solo usa listOrders
  const wrapper = ({ children }: { children: ReactNode }) => <OrdersProvider module={module}>{children}</OrdersProvider>;
  return { requests, listOrders, ...renderHook(() => useOrdersList(), { wrapper }) };
}

describe('useOrdersList', () => {
  it('empieza cargando y pasa a ready con los pedidos del caso de uso', async () => {
    const { result, requests } = setup();
    expect(result.current.state).toEqual({ status: 'loading' });
    await act(async () => requests[0].resolve([anOrder('P-1')]));
    expect(result.current.state).toEqual({ status: 'ready', orders: [anOrder('P-1')], refreshing: false });
  });

  it('si la carga falla pasa a error, y reload vuelve a pedir y se recupera', async () => {
    const { result, requests, listOrders } = setup();
    await act(async () => requests[0].reject(new Error('sin red')));
    expect(result.current.state).toEqual({ status: 'error' });

    act(() => result.current.reload());
    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(listOrders).toHaveBeenCalledTimes(2));
    await act(async () => requests[1].resolve([anOrder('P-2')]));
    expect(result.current.state).toMatchObject({ status: 'ready', orders: [anOrder('P-2')] });
  });

  it('al recargar con datos en pantalla no vuelve a «loading»: marca refreshing', async () => {
    const { result, requests } = setup();
    await act(async () => requests[0].resolve([anOrder('P-1')]));
    act(() => result.current.reload());
    expect(result.current.state).toEqual({ status: 'ready', orders: [anOrder('P-1')], refreshing: true });
  });

  it('una respuesta antigua que llega tarde NO pisa a la nueva (condición de carrera)', async () => {
    const { result, requests, listOrders } = setup();
    act(() => result.current.reload()); // segunda petición antes de que llegue la primera
    await waitFor(() => expect(listOrders).toHaveBeenCalledTimes(2));
    await act(async () => requests[1].resolve([anOrder('NUEVA')]));
    await act(async () => requests[0].resolve([anOrder('ANTIGUA')]));
    expect(result.current.state).toMatchObject({ status: 'ready', orders: [anOrder('NUEVA')] });
  });

  it('reload es estable entre renders (se puede usar como dependencia de un efecto)', async () => {
    const { result, requests } = setup();
    const first = result.current.reload;
    await act(async () => requests[0].resolve([]));
    expect(result.current.reload).toBe(first);
  });
});
