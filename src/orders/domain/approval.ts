// DOMINIO · Regla de aprobación y transición del pedido.
// Origen: src/pages/OrdersPage.tsx (handleApprove) validaba sesión, rol, estado, líneas e importe dentro del handler.
// Mismo estilo que cancellation.ts: Result con códigos estables, transición inmutable y evento con la fecha por parámetro.
import type { Actor } from './cancellation';
import { calculateTotal, type Order } from './order';
import { err, ok, type Result } from './result';

/** Por encima de este total (con descuento e IVA) solo aprueba un administrador. */
export const ADMIN_APPROVAL_FROM = 10000;

export type ApprovalDenied = 'no-session' | 'forbidden' | 'not-pending' | 'invalid-lines' | 'needs-admin';

export type OrderApproved = {
  type: 'OrderApproved';
  orderId: string;
  approvedBy: string;
  total: number;
  occurredAt: string; // ISO 8601
};

export function checkApproval(order: Order, actor: Actor | null): Result<Actor, ApprovalDenied> {
  if (actor === null) return err('no-session');
  if (actor.role !== 'admin' && actor.role !== 'manager') return err('forbidden');
  if (order.status !== 'pending') return err('not-pending');
  if (order.lines.length === 0 || order.lines.some((line) => line.quantity <= 0)) return err('invalid-lines');
  if (calculateTotal(order) > ADMIN_APPROVAL_FROM && actor.role !== 'admin') return err('needs-admin');
  return ok(actor);
}

export function canApprove(order: Order, actor: Actor | null): boolean {
  return checkApproval(order, actor).ok;
}

export function approveOrder(order: Order, actor: Actor | null, now: Date): Result<{ order: Order; event: OrderApproved }, ApprovalDenied> {
  const check = checkApproval(order, actor);
  if (!check.ok) return check;
  return ok({
    order: { ...order, status: 'approved' },
    event: { type: 'OrderApproved', orderId: order.id, approvedBy: check.value.id, total: calculateTotal(order), occurredAt: now.toISOString() },
  });
}
