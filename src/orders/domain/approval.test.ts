// @vitest-environment node
import { approveOrder, canApprove, checkApproval, type ApprovalDenied } from './approval';
import type { Actor } from './cancellation';
import type { Order, OrderStatus } from './order';

const anOrder = (status: OrderStatus, unitPrice = 1000, quantity = 1): Order => ({
  id: 'P-1', customerName: 'Talleres Norte', customerTier: 'standard', status, ownerId: 'u2',
  createdAt: '2026-11-18T10:00:00Z', lines: [{ sku: 'A-10', quantity, unitPrice }],
});
const admin: Actor = { id: 'u1', role: 'admin' };
const manager: Actor = { id: 'u2', role: 'manager' };
const agent: Actor = { id: 'u3', role: 'agent' };

describe('regla de aprobación', () => {
  // Totales con IVA (cliente standard): 1000 → 1210 € · 8264 → 9999,44 € · 8265 → 10000,65 €
  const cases: [string, Order, Actor | null, true | ApprovalDenied][] = [
    ['sin sesión', anOrder('pending'), null, 'no-session'],
    ['agente', anOrder('pending'), agent, 'forbidden'],
    ['manager · pendiente', anOrder('pending'), manager, true],
    ['manager · aprobado', anOrder('approved'), manager, 'not-pending'],
    ['manager · cantidad 0', anOrder('pending', 1000, 0), manager, 'invalid-lines'],
    ['manager · 9999,44 €', anOrder('pending', 8264), manager, true],
    ['manager · 10000,65 €', anOrder('pending', 8265), manager, 'needs-admin'],
    ['admin · 10000,65 €', anOrder('pending', 8265), admin, true],
  ];

  it.each(cases)('%s', (_name, order, actor, expected) => {
    const check = checkApproval(order, actor);
    expect(check.ok ? true : check.error).toBe(expected);
    expect(canApprove(order, actor)).toBe(expected === true);
  });
});

describe('approveOrder', () => {
  it('devuelve un pedido NUEVO aprobado y el evento OrderApproved', () => {
    const original = Object.freeze(anOrder('pending'));
    const result = approveOrder(original, manager, new Date('2026-11-18T18:00:00Z'));
    expect(result).toEqual({
      ok: true,
      value: {
        order: expect.objectContaining({ id: 'P-1', status: 'approved' }),
        event: { type: 'OrderApproved', orderId: 'P-1', approvedBy: 'u2', total: 1210, occurredAt: '2026-11-18T18:00:00.000Z' },
      },
    });
    expect(original.status).toBe('pending');
  });
});
