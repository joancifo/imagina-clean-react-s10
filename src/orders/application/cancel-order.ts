// APLICACIÓN · Caso de uso «Cancelar pedido».
// Orquesta: validar la entrada → cargar → decidir (dominio) → ejecutar → notificar.
// No contiene reglas de negocio (viven en domain/) ni detalles técnicos (viven en los adapters).
import { cancelOrder as decideCancellation, type Actor, type CancellationDenied } from '../domain/cancellation';
import { createCancellationReason, type ReasonError } from '../domain/cancellation-reason';
import type { Order } from '../domain/order';
import { err, ok, type Result } from '../domain/result';
import { OrderGatewayError, type Clock, type EventPublisher, type GatewayFailure, type OrderGateway } from './ports';

/** Entrada explícita: lo que pide quien usa el caso de uso (la UI, un test, un script). */
export type CancelOrderCommand = { orderId: string; reason: string; actor: Actor | null };

/** Todos los fallos PREVISIBLES, por origen: entrada (ReasonError), regla (CancellationDenied) e infraestructura (GatewayFailure). */
export type CancelOrderError = ReasonError | CancellationDenied | GatewayFailure;

// Sesión 5 · Interface Segregation: este caso de uso declara solo las operaciones del puerto que usa.
export type CancelOrderDeps = { orders: Pick<OrderGateway, 'findById' | 'cancel'>; clock: Clock; events: EventPublisher };

export type CancelOrder = (command: CancelOrderCommand) => Promise<Result<Order, CancelOrderError>>;

/** Factory: recibe los puertos una vez (Composition Root) y devuelve el caso de uso listo para usar. */
export function createCancelOrder({ orders, clock, events }: CancelOrderDeps): CancelOrder {
  return async ({ orderId, reason: rawReason, actor }) => {
    // 1 · Entrada: sin un motivo válido no se toca la red.
    const reason = createCancellationReason(rawReason);
    if (!reason.ok) return reason;

    try {
      // 2 · Cargar el estado actual (el que ve la pantalla puede estar desactualizado).
      const order = await orders.findById(orderId);
      if (order === null) return err('not-found');

      // 3 · Decidir: la regla es del dominio. La hora la da el puerto Clock.
      const decision = decideCancellation(order, actor, reason.value, clock.now());
      if (!decision.ok) return decision;

      // 4 · Ejecutar en el backend.
      const { event } = decision.value;
      await orders.cancel({ orderId, reason: reason.value, cancelledBy: event.cancelledBy });

      // 5 · Notificar. El pedido YA está cancelado: un fallo de analítica no puede deshacerlo ni ocultarlo.
      await events.publish(event).catch(() => undefined);

      return ok(decision.value.order);
    } catch (error) {
      // Solo se traducen los fallos previsibles de infraestructura. Un bug sigue siendo una excepción.
      if (error instanceof OrderGatewayError) return err(error.failure);
      throw error;
    }
  };
}
