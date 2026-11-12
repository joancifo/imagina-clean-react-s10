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

export type CancelOrderDeps = { orders: OrderGateway; clock: Clock; events: EventPublisher };

export type CancelOrder = (command: CancelOrderCommand) => Promise<Result<Order, CancelOrderError>>;

// Ejercicio S4 · Parte A. Requisitos en cancel-order.test.ts:
// 1 · motivo no válido → error SIN llamar a ningún puerto
// 2 · findById → null = 'not-found'
// 3 · decidir con el dominio (decideCancellation) y la hora de clock
// 4 · orders.cancel(…)   5 · events.publish(evento) — si falla, el resultado sigue siendo ok
// OrderGatewayError → err(error.failure) · cualquier otro error se propaga
/** Factory: recibe los puertos una vez (Composition Root) y devuelve el caso de uso listo para usar. */
export function createCancelOrder({ orders, clock, events }: CancelOrderDeps): CancelOrder {
  void [orders, clock, events, decideCancellation, createCancellationReason, err, ok, OrderGatewayError];
  return async () => {
    throw new Error('Por implementar (ejercicio S4 · Parte A)');
  };
}
