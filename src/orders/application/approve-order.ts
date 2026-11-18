// APLICACIÓN · Caso de uso «Aprobar pedido». Misma forma que cancel-order.ts (Sesión 4).
// Sustituye a handleApprove de la pantalla heredada: validar, decidir, llamar al backend y medir.
// Lo que NO hace: navegar ni mostrar avisos. Eso es presentación (OrdersListPage).
import { approveOrder as decideApproval, DEFAULT_APPROVAL_DRAFT, type ApprovalDenied, type ApprovalDraft } from '../domain/approval';
import type { Actor } from '../domain/cancellation';
import type { Order } from '../domain/order';
import { err, ok, type Result } from '../domain/result';
import { OrderGatewayError, type Clock, type EventPublisher, type GatewayFailure, type OrderGateway } from './ports';

export type ApproveOrderCommand = { orderId: string; actor: Actor | null; draft?: ApprovalDraft };
export type ApproveOrderError = ApprovalDenied | GatewayFailure;
export type ApproveOrder = (command: ApproveOrderCommand) => Promise<Result<Order, ApproveOrderError>>;
export type ApproveOrderDeps = { orders: Pick<OrderGateway, 'findById' | 'approve'>; clock: Clock; events: EventPublisher };

export function createApproveOrder({ orders, clock, events }: ApproveOrderDeps): ApproveOrder {
  return async ({ orderId, actor, draft = DEFAULT_APPROVAL_DRAFT }) => {
    try {
      const order = await orders.findById(orderId); // estado ACTUAL, no el que mostraba la pantalla
      if (order === null) return err('not-found');

      const decision = decideApproval(order, actor, clock.now(), draft);
      if (!decision.ok) return decision;

      await orders.approve({ orderId, approvedBy: decision.value.event.approvedBy });
      await events.publish(decision.value.event).catch(() => undefined); // best effort
      return ok(decision.value.order);
    } catch (error) {
      if (error instanceof OrderGatewayError) return err(error.failure);
      throw error;
    }
  };
}
