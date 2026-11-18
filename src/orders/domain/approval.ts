// DOMINIO · Regla de aprobación y transición del pedido.
// Origen: src/pages/OrdersPage.tsx (handleApprove) validaba sesión, rol, estado, líneas e importe dentro del handler.
// Mismo estilo que cancellation.ts: Result con códigos estables, transición inmutable y evento con la fecha por parámetro.
import policy from '../../../shared/policy.json';
import type { Actor } from './cancellation';
import { calculateTotal, isUrgent, type Order } from './order';
import { err, ok, type Result } from './result';

/** Por encima de este total (con descuento e IVA) solo aprueba un administrador. */
export const ADMIN_APPROVAL_FROM = policy.approval.adminFrom;

export type ApprovalDenied = 'no-session' | 'forbidden' | 'not-pending' | 'invalid-lines' | 'needs-admin' | 'needs-justification';

// ── Sesión 6 · Justificación de la aprobación ─────────────────────────────────────
export type ApprovalChannel = 'web' | 'phone' | 'email';
export const APPROVAL_CHANNELS: ApprovalChannel[] = ['web', 'phone', 'email'];

/** Lo que acompaña a una aprobación. El formulario lo prepara; el dominio decide si basta. */
export type ApprovalDraft = { note: string | null; channel: ApprovalChannel };
export const DEFAULT_APPROVAL_DRAFT: ApprovalDraft = { note: null, channel: 'web' };

/** Un pedido urgente no se aprueba «porque sí»: queda por escrito quién lo justifica y por dónde llegó. */
export const needsJustification = (order: Order): boolean => isUrgent(order);

export type OrderApproved = {
  type: 'OrderApproved';
  orderId: string;
  approvedBy: string;
  total: number;
  channel: ApprovalChannel;
  /** La nota NO viaja en el evento: es texto libre de una persona. Solo si la hubo. */
  hasNote: boolean;
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

export function approveOrder(
  order: Order,
  actor: Actor | null,
  now: Date,
  draft: ApprovalDraft = DEFAULT_APPROVAL_DRAFT,
): Result<{ order: Order; event: OrderApproved }, ApprovalDenied> {
  const check = checkApproval(order, actor);
  if (!check.ok) return check;
  // Defensa en profundidad: el formulario ya lo pide, pero quien llama al caso de uso puede no ser el formulario.
  if (needsJustification(order) && draft.note === null) return err('needs-justification');
  return ok({
    order: { ...order, status: 'approved' },
    event: {
      type: 'OrderApproved',
      orderId: order.id,
      approvedBy: check.value.id,
      total: calculateTotal(order),
      channel: draft.channel,
      hasNote: draft.note !== null,
      occurredAt: now.toISOString(),
    },
  });
}
