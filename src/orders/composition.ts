// COMPOSICIÓN · Único lugar donde se eligen implementaciones concretas y se conectan con los casos de uso.
// Sesión 4: ya no exporta instancias globales (singletons). Exporta FÁBRICAS: quien arranca la aplicación
// (src/main.tsx) o un test decide qué adapters usar y crea el módulo una vez.
import { createApproveOrder, type ApproveOrder } from './application/approve-order';
import { createCancelOrder, type CancelOrder } from './application/cancel-order';
import { listUrgentOrders, type UrgentOrder } from './application/list-urgent-orders';
import { loadOrderSummary, type OrderSummary } from './application/load-order-summary';
import type { Clock, EventPublisher, OrderGateway, OrderReader } from './application/ports';
import type { Order } from './domain/order';
import { createAnalyticsEventPublisher } from './infrastructure/analytics-event-publisher';
import { createHttpOrderGateway } from './infrastructure/http-order-gateway';
import { createHttpOrderReader } from './infrastructure/http-order-reader';
import { createInMemoryEventPublisher } from './infrastructure/in-memory-event-publisher';
import { createInMemoryOrderGateway } from './infrastructure/in-memory-order-gateway';
import { systemClock } from './infrastructure/system-clock';

/** Lo que necesita la feature del exterior: un adapter por puerto. */
export type OrdersAdapters = { reader: OrderReader; gateway: OrderGateway; clock: Clock; events: EventPublisher };

/** Lo que la feature ofrece a la UI: casos de uso listos para llamar. Ni adapters ni fetch. */
export type OrdersModule = {
  loadOrderSummary: () => Promise<OrderSummary>;
  listUrgentOrders: () => Promise<UrgentOrder[]>;
  cancelOrder: CancelOrder;
  // Sesión 5
  /** Consulta de paso: no añade lógica. Se acepta a propósito para que la UI no reciba el puerto (ADR-003). */
  listOrders: () => Promise<Order[]>;
  approveOrder: ApproveOrder;
};

/** Conecta casos de uso con adapters. Inyección manual (Pure DI): sin contenedor, sin decoradores. */
export function createOrdersModule({ reader, gateway, clock, events }: OrdersAdapters): OrdersModule {
  return {
    loadOrderSummary: () => loadOrderSummary(reader),
    listUrgentOrders: () => listUrgentOrders(reader),
    cancelOrder: createCancelOrder({ orders: gateway, clock, events }),
    listOrders: () => reader.findAll(),
    approveOrder: createApproveOrder({ orders: gateway, clock, events }),
  };
}

/** Producción: backend heredado por HTTP, reloj del sistema y analítica en /api/logs. */
export function createHttpAdapters(fetchFn: typeof fetch, baseUrl = '/api'): OrdersAdapters {
  return {
    reader: createHttpOrderReader(fetchFn, baseUrl),
    gateway: createHttpOrderGateway(fetchFn, baseUrl),
    clock: systemClock,
    events: createAnalyticsEventPublisher(fetchFn, baseUrl),
  };
}

/** Tests, demos, Storybook y desarrollo sin backend: todo en memoria y observable. */
export function createInMemoryAdapters(seed: Order[] = [], clock: Clock = systemClock) {
  const store = createInMemoryOrderGateway(seed);
  const events = createInMemoryEventPublisher();
  return { reader: store, gateway: store, clock, events } satisfies OrdersAdapters;
}
