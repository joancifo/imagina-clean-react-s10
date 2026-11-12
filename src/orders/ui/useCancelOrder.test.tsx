// Ejercicio S4 · Parte C · El hook adaptador se prueba con el módulo REAL y adapters en memoria.
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { OrderGatewayError } from '../application/ports';
import { createInMemoryAdapters, createOrdersModule, type OrdersAdapters } from '../composition';
import type { Order } from '../domain/order';
import { OrdersProvider } from './OrdersProvider';
import { useCancelOrder } from './useCancelOrder';

const pending: Order = {
  id: 'P-1005', customerName: 'Hotel Brisa', customerTier: 'silver', status: 'pending', ownerId: 'u2',
  createdAt: '2026-10-08T10:00:00Z', lines: [{ sku: 'A-10', quantity: 10, unitPrice: 32.5 }],
};
const manager = { id: 'u2', role: 'manager' as const };
const command = { orderId: 'P-1005', reason: 'Cliente duplicado en el ERP', actor: manager };

function renderWith(adapters: OrdersAdapters) {
  const wrapper = ({ children }: { children: ReactNode }) => <OrdersProvider module={createOrdersModule(adapters)}>{children}</OrdersProvider>;
  return renderHook(() => useCancelOrder(), { wrapper });
}

// Parte C · paso 3: quita .skip
describe.skip('useCancelOrder', () => {
  it('cancela a través del caso de uso: el fake queda cancelado y se publica el evento', async () => {
    const adapters = createInMemoryAdapters([pending], { now: () => new Date('2026-11-16T18:00:00Z') });
    const { result } = renderWith(adapters);
    await act(async () => expect(await result.current.cancel(command)).toEqual({ ok: true }));
    expect((await adapters.gateway.findById('P-1005'))?.status).toBe('cancelled');
    expect(adapters.events.published).toEqual([expect.objectContaining({ type: 'OrderCancelled', orderId: 'P-1005', occurredAt: '2026-11-16T18:00:00.000Z' })]);
  });

  it('traduce el código del caso de uso a un mensaje para la persona usuaria', async () => {
    const base = createInMemoryAdapters([pending]);
    const { result } = renderWith({ ...base, gateway: { ...base.gateway, cancel: async () => { throw new OrderGatewayError('conflict'); } } });
    await act(async () => {
      expect(await result.current.cancel(command)).toEqual({ ok: false, message: 'Otra persona ha cambiado este pedido. Recarga la lista y vuelve a intentarlo' });
    });
  });

  it('pending es true mientras el caso de uso trabaja y vuelve a false al terminar', async () => {
    let release: () => void = () => {};
    const base = createInMemoryAdapters([pending]);
    const slow = { ...base.gateway, cancel: () => new Promise<void>((resolve) => { release = resolve; }) };
    const { result } = renderWith({ ...base, gateway: slow });
    let call: Promise<unknown> = Promise.resolve();
    act(() => { call = result.current.cancel(command); });
    await waitFor(() => expect(result.current.pending).toBe(true));
    await act(async () => { release(); await call; });
    expect(result.current.pending).toBe(false);
  });

  it('un error inesperado (bug) no rompe la pantalla: mensaje genérico', async () => {
    const base = createInMemoryAdapters([pending]);
    const { result } = renderWith({ ...base, gateway: { ...base.gateway, findById: async () => { throw new TypeError('boom'); } } });
    await act(async () => {
      expect(await result.current.cancel(command)).toEqual({ ok: false, message: 'No se pudo cancelar el pedido por un error inesperado' });
    });
  });
});
