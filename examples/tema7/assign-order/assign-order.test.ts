// @vitest-environment node
// TEMA 7 · Un caso de uso se prueba con dobles de los puertos: rápido, determinista y sin red.
import type { Order } from '../../../src/orders/domain/order';
import { createAssignOrder, type Actor, type Notifier, type OrderStore, type User, type UserDirectory } from './assign-order';

const order: Order = { id: 'P-1', customerName: 'Talleres Norte', customerTier: 'gold', status: 'pending', ownerId: 'u2', createdAt: '2026-11-16T09:00:00Z', lines: [{ sku: 'A', quantity: 1, unitPrice: 10 }] };
const people: User[] = [{ id: 'u2', name: 'Pau', active: true }, { id: 'u3', name: 'Iris', active: true }, { id: 'u9', name: 'Baja', active: false }];
const manager: Actor = { id: 'u2', role: 'manager' };

function setup(orders: Order[] = [order]) {
  const calls: string[] = [];
  const store: OrderStore = {                       // FAKE: se comporta como el de verdad, en memoria
    findById: async (id) => (calls.push(`orders.findById:${id}`), orders.find((o) => o.id === id) ?? null),
    saveOwner: async (id, owner) => { calls.push(`orders.saveOwner:${id}→${owner}`); },
  };
  const users: UserDirectory = { findById: async (id) => (calls.push(`users.findById:${id}`), people.find((u) => u.id === id) ?? null) }; // STUB
  const sent: string[] = [];
  const notifier: Notifier = { notify: async (userId, message) => { calls.push('notify'); sent.push(`${userId}: ${message}`); } }; // SPY
  const assignOrder = createAssignOrder({ orders: store, users, notifier, clock: { now: () => new Date('2026-11-16T17:00:00Z') } });
  return { assignOrder, calls, sent };
}

it('reasigna, notifica a la nueva persona y devuelve el cambio con la hora del reloj', async () => {
  const { assignOrder, sent } = setup();
  expect(await assignOrder({ orderId: 'P-1', assigneeId: 'u3', actor: manager })).toEqual({ ok: true, value: { orderId: 'P-1', from: 'u2', to: 'u3', at: '2026-11-16T17:00:00.000Z' } });
  expect(sent).toEqual(['u3: Te han asignado el pedido P-1']);
});

it('un agente no puede reasignar y no se hace ninguna llamada', async () => {
  const { assignOrder, calls } = setup();
  expect(await assignOrder({ orderId: 'P-1', assigneeId: 'u3', actor: { id: 'u3', role: 'agent' } })).toEqual({ ok: false, error: 'forbidden' });
  expect(calls).toEqual([]);
});

it.each([
  ['pedido inexistente', 'P-404', 'u3', 'not-found'],
  ['persona inexistente', 'P-1', 'u404', 'unknown-user'],
  ['persona dada de baja', 'P-1', 'u9', 'inactive-user'],
  ['ya es la responsable', 'P-1', 'u2', 'same-owner'],
])('%s → %s sin guardar ni notificar', async (_name, orderId, assigneeId, error) => {
  const { assignOrder, calls } = setup();
  expect(await assignOrder({ orderId, assigneeId, actor: manager })).toEqual({ ok: false, error });
  expect(calls.some((c) => c.startsWith('orders.saveOwner') || c === 'notify')).toBe(false);
});

it('un pedido cerrado no se reasigna', async () => {
  const { assignOrder } = setup([{ ...order, status: 'shipped' }]);
  expect(await assignOrder({ orderId: 'P-1', assigneeId: 'u3', actor: manager })).toEqual({ ok: false, error: 'order-closed' });
});
