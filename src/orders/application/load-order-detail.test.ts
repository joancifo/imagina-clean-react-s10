// @vitest-environment node
// Material S7 · El caso de uso del detalle, con dobles escritos a mano (sin red y sin vi.mock).
import { OrderGatewayError } from './ports';
import { createLoadOrderDetail } from './load-order-detail';
import type { Order } from '../domain/order';

const ORDER: Order = { id: 'P-1', customerName: 'Hotel Brisa', customerTier: 'silver', status: 'pending', ownerId: 'u2', createdAt: '2026-10-08T10:00:00Z', lines: [] };

it('devuelve el pedido', async () => {
  expect(await createLoadOrderDetail({ orders: { findById: async () => ORDER } })({ orderId: 'P-1' })).toEqual({ ok: true, value: ORDER });
});

it('un pedido que no existe es un resultado, no una excepción', async () => {
  expect(await createLoadOrderDetail({ orders: { findById: async () => null } })({ orderId: 'P-9' })).toEqual({ ok: false, error: 'not-found' });
});

it('cualquier fallo previsible de infraestructura es «unavailable» (403 incluido: la pantalla no distingue)', async () => {
  const failing = (failure: 'unavailable' | 'forbidden') => createLoadOrderDetail({ orders: { findById: async () => { throw new OrderGatewayError(failure); } } });
  expect(await failing('unavailable')({ orderId: 'P-1' })).toEqual({ ok: false, error: 'unavailable' });
  expect(await failing('forbidden')({ orderId: 'P-1' })).toEqual({ ok: false, error: 'unavailable' });
});

it('un bug sigue siendo una excepción', async () => {
  const buggy = createLoadOrderDetail({ orders: { findById: async () => { throw new TypeError('bug'); } } });
  await expect(buggy({ orderId: 'P-1' })).rejects.toThrow(TypeError);
});
