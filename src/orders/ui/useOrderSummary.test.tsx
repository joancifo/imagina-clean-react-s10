import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useOrderSummary } from './useOrderSummary';
import { OrdersProvider } from './OrdersProvider';
import { createInMemoryAdapters, createOrdersModule, type OrdersAdapters } from '../composition';

// El test es otro Composition Root: elige adapters en memoria y los entrega por el Provider.
const wrapperWith = (adapters: OrdersAdapters) => ({ children }: { children: ReactNode }) => (
  <OrdersProvider module={createOrdersModule(adapters)}>{children}</OrdersProvider>
);

it('el hook se prueba con adapters en memoria, sin servidor', async () => {
  const { result } = renderHook(() => useOrderSummary(), { wrapper: wrapperWith(createInMemoryAdapters([])) });
  expect(result.current.status).toBe('loading');
  await waitFor(() => expect(result.current).toEqual({ status: 'ready', summary: { pendingCount: 0, pendingAmount: 0, urgentCount: 0 } }));
});

it('expone el error sin alert() ni console', async () => {
  const failing = { ...createInMemoryAdapters([]), reader: { findAll: async () => { throw new Error('caído'); } } };
  const { result } = renderHook(() => useOrderSummary(), { wrapper: wrapperWith(failing) });
  await waitFor(() => expect(result.current.status).toBe('error'));
});

it('sin Provider falla en voz alta (no hay un singleton escondido de repuesto)', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => renderHook(() => useOrderSummary())).toThrow('fuera de <OrdersProvider>');
});
