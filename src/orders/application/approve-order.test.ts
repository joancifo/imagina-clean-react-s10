// @vitest-environment node
// Dobles escritos a mano: la aplicación no importa infraestructura ni composición, tampoco en sus tests.
import type { OrderApproved } from '../domain/approval';
import type { Order } from '../domain/order';
import { createApproveOrder } from './approve-order';
import { OrderGatewayError, type DomainEvent } from './ports';

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 'P-1', customerName: 'Hotel Brisa', customerTier: 'standard', status: 'pending', ownerId: 'u2',
  createdAt: '2026-11-18T10:00:00Z', lines: [{ sku: 'A-10', quantity: 1, unitPrice: 1000 }], ...overrides,
});
const manager = { id: 'u2', role: 'manager' as const };
const clock = { now: () => new Date('2026-11-18T18:00:00Z') };

function setup(seed: Order[], approveFails?: Error) {
  const approved: string[] = [];
  const published: DomainEvent[] = [];
  const approve = createApproveOrder({
    orders: {
      findById: async (id) => seed.find((o) => o.id === id) ?? null,
      approve: async ({ orderId }) => {
        if (approveFails) throw approveFails;
        approved.push(orderId);
      },
    },
    clock,
    events: { publish: async (event) => { published.push(event); } },
  });
  return { approve, approved, published };
}

it('aprueba en el backend y publica OrderApproved', async () => {
  const { approve, approved, published } = setup([order()]);
  const result = await approve({ orderId: 'P-1', actor: manager });
  expect(result.ok && result.value.status).toBe('approved');
  expect(approved).toEqual(['P-1']);
  expect(published).toEqual([{ type: 'OrderApproved', orderId: 'P-1', approvedBy: 'u2', total: 1210, occurredAt: '2026-11-18T18:00:00.000Z' } satisfies OrderApproved]);
});

it('la regla se aplica al estado ACTUAL del backend', async () => {
  const { approve, approved, published } = setup([order({ status: 'cancelled' })]);
  expect(await approve({ orderId: 'P-1', actor: manager })).toEqual({ ok: false, error: 'not-pending' });
  expect([approved, published]).toEqual([[], []]);
});

it('un pedido que no existe es not-found', async () => {
  const { approve } = setup([]);
  expect(await approve({ orderId: 'P-9', actor: manager })).toEqual({ ok: false, error: 'not-found' });
});

it('un fallo previsible del gateway sale como Result; un bug se propaga', async () => {
  expect(await setup([order()], new OrderGatewayError('unavailable')).approve({ orderId: 'P-1', actor: manager })).toEqual({ ok: false, error: 'unavailable' });
  await expect(setup([order()], new TypeError('bug')).approve({ orderId: 'P-1', actor: manager })).rejects.toThrow(TypeError);
});
