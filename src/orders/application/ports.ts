// APLICACIÓN · Puertos: contratos que el núcleo necesita y que la infraestructura implementa.
// Un puerto se escribe en el lenguaje del caso de uso que lo necesita, no en el de la tecnología que lo implementa.
import type { CancellationReason } from '../domain/cancellation-reason';
import type { OrderCancelled } from '../domain/cancellation';
import type { Order } from '../domain/order';

// ── Lectura (Sesión 2) ─────────────────────────────────────────────────────────────
export interface OrderReader {
  /** Devuelve todos los pedidos visibles. Lanza OrderReadError si no puede leerlos. */
  findAll(): Promise<Order[]>;
}

export class OrderReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderReadError';
  }
}

// ── Escritura de pedidos (Sesión 4) ───────────────────────────────────────────────
/** Fallos de infraestructura que el caso de uso SÍ sabe tratar. Códigos estables, sin HTTP. */
export type GatewayFailure = 'not-found' | 'conflict' | 'unavailable';

/** El adapter traduce cualquier fallo previsible (404, 409, 5xx, red caída…) a este error. */
export class OrderGatewayError extends Error {
  constructor(
    readonly failure: GatewayFailure,
    message: string = failure,
  ) {
    super(message);
    this.name = 'OrderGatewayError';
  }
}

export type CancelRequest = { orderId: string; reason: CancellationReason; cancelledBy: string };

export interface OrderGateway {
  /** El pedido o null si no existe. Lanza OrderGatewayError('unavailable') si no puede saberlo. */
  findById(id: string): Promise<Order | null>;
  /**
   * Pide al backend que cancele el pedido.
   * Lanza OrderGatewayError: 'not-found' si no existe · 'conflict' si su estado ya no lo permite · 'unavailable' si no hay respuesta útil.
   */
  cancel(request: CancelRequest): Promise<void>;
}

// ── Detalles del entorno convertidos en puertos (Sesión 4) ────────────────────────
/** El reloj es un detalle: en producción, la hora del sistema; en los tests, una fecha fija. */
export interface Clock {
  now(): Date;
}

export type DomainEvent = OrderCancelled;

/** Publica hechos ya ocurridos (analítica, auditoría…). Quien publica no sabe quién escucha. */
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
