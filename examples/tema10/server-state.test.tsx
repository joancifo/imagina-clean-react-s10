// TEMA 10 · La caché se prueba con el módulo en memoria: ni red ni mocks de la librería.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createInMemoryAdapters, createOrdersModule } from '../../src/orders/composition';
import type { Order } from '../../src/orders/domain/order';
import { OrdersProvider } from '../../src/orders/ui/OrdersProvider';
import { useCancelOrderMutation, useOrdersQuery, useUrgentCount } from './server-state';

const SEED: Order[] = [
  { id: 'P-1', customerName: 'Hotel Brisa', customerTier: 'standard', status: 'pending', ownerId: 'u2', createdAt: '2026-11-18T10:00:00Z', lines: [{ sku: 'A', quantity: 1, unitPrice: 300 }] },
  { id: 'P-3', customerName: 'Construcciones Vega', customerTier: 'standard', status: 'pending', ownerId: 'u3', createdAt: '2026-11-18T10:00:00Z', lines: [{ sku: 'D', quantity: 1, unitPrice: 5000 }] },
];

function setup() {
  const module = createOrdersModule(createInMemoryAdapters(SEED));
  const listOrders = vi.spyOn(module, 'listOrders');
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }); // una caché nueva por test
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <OrdersProvider module={module}>{children}</OrdersProvider>
    </QueryClientProvider>
  );
  const hooks = renderHook(() => ({ list: useOrdersQuery(), urgent: useUrgentCount(), cancel: useCancelOrderMutation() }), { wrapper });
  return { listOrders, ...hooks };
}

it('dos hooks con la misma clave comparten UNA petición (deduplicación)', async () => {
  const { result, listOrders } = setup();
  await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
  expect(result.current.list.data?.map((order) => order.id)).toEqual(['P-1', 'P-3']);
  expect(result.current.urgent.data).toBe(1); // derivado con select: solo P-3 supera los 3000 €
  expect(listOrders).toHaveBeenCalledTimes(1);
});

it('tras cancelar con el caso de uso, se invalida la caché y la lista se vuelve a pedir', async () => {
  const { result, listOrders } = setup();
  await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

  await act(async () => {
    await result.current.cancel.mutateAsync({ orderId: 'P-3', reason: 'Cliente duplicado en el ERP', actor: { id: 'u1', role: 'admin' } });
  });

  await waitFor(() => expect(result.current.list.data?.find((order) => order.id === 'P-3')?.status).toBe('cancelled'));
  expect(result.current.urgent.data).toBe(0);
  expect(listOrders).toHaveBeenCalledTimes(2);
});

it('si el caso de uso rechaza el comando (Result con error), la caché NO se invalida', async () => {
  const { result, listOrders } = setup();
  await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
  let outcome: unknown;
  await act(async () => {
    outcome = await result.current.cancel.mutateAsync({ orderId: 'P-3', reason: 'corto', actor: { id: 'u1', role: 'admin' } });
  });
  expect(outcome).toEqual({ ok: false, error: 'too-short' });
  expect(listOrders).toHaveBeenCalledTimes(1);
});
