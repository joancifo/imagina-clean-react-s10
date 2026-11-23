// PRUEBAS · Datos de prueba de la feature Pedidos. Un solo sitio para todos los tests.
//
// Por qué un builder y no un objeto copiado en cada archivo:
//   1. Cada test dice SOLO lo que le importa. El resto son valores válidos por defecto.
//      Un test que enseña diez campos para comprobar uno esconde cuál es el que importa.
//   2. Cuando Order gane un campo obligatorio, se cambia AQUÍ y en ningún otro sitio.
//      (La Sesión 8 empezó con cuatro helpers `order(...)` distintos en cuatro archivos.)
//
// Referencias: N. Pryce, «Test Data Builders» (2007) · G. Meszaros, «xUnit Test Patterns» (2007), Object Mother.
import type { Actor } from '../domain/cancellation';
import type { Order, OrderLine } from '../domain/order';
import type { OrderDto } from '../infrastructure/order-dto';

// ── Pedidos ───────────────────────────────────────────────────────────────────────
/** Pedido mínimo VÁLIDO: pendiente, cliente sin descuento, una línea de 100 € (121,00 € con IVA). */
const BASE_ORDER: Order = {
  id: 'P-1000',
  customerName: 'Cliente de prueba',
  customerTier: 'standard',
  status: 'pending',
  ownerId: 'u2',
  createdAt: '2026-11-02T09:00:00Z',
  lines: [{ sku: 'A-10', quantity: 1, unitPrice: 100 }],
};

/** `anOrder()` para el caso normal; `anOrder({ status: 'shipped' })` para cambiar lo que importa. */
export function anOrder(overrides: Partial<Order> = {}): Order {
  return { ...structuredClone(BASE_ORDER), ...structuredClone(overrides) };
}

/** Línea de pedido con valores por defecto. `aLine({ quantity: 40 })`. */
export function aLine(overrides: Partial<OrderLine> = {}): OrderLine {
  return { sku: 'A-10', quantity: 1, unitPrice: 100, ...overrides };
}

// ── Object mothers: casos con NOMBRE DE NEGOCIO ───────────────────────────────────
// `anUrgentOrder()` se lee de un vistazo. `anOrder({ lines: [{ sku: 'D-40', quantity: 60, unitPrice: 95 }] })`
// obliga a calcular 60 × 95 × 1,21 mentalmente para saber de qué va el test.

/** Pendiente y por encima del umbral de urgencia (3.000 €): 6.207,30 € con descuento gold e IVA. */
export const anUrgentOrder = (overrides: Partial<Order> = {}): Order =>
  anOrder({ customerTier: 'gold', status: 'pending', lines: [aLine({ sku: 'D-40', quantity: 60, unitPrice: 95 })], ...overrides });

/** Por encima del límite de un manager para cancelar (5.000 €) y del de aprobación de admin (10.000 €). */
export const aHugeOrder = (overrides: Partial<Order> = {}): Order =>
  anOrder({ lines: [aLine({ quantity: 1, unitPrice: 12000 })], ...overrides });

export const anApprovedOrder = (overrides: Partial<Order> = {}): Order => anOrder({ status: 'approved', ...overrides });
export const aShippedOrder = (overrides: Partial<Order> = {}): Order => anOrder({ status: 'shipped', ...overrides });
export const aCancelledOrder = (overrides: Partial<Order> = {}): Order => anOrder({ status: 'cancelled', ...overrides });

/** Ejercicio S8 · Parte A · Lo que recibe un AGENTE: el BFF no le dice de quién es el pedido ni le envía
 *  las líneas. Hoy esto no se puede escribir sin mentirle al compilador, porque `Order.ownerId` promete
 *  un string que el backend no siempre manda. Quitar ese `as` es el primer paso de la Parte A. */
export const anOrderWithoutOwner = (overrides: Partial<Order> = {}): Order =>
  anOrder({ ownerId: null as unknown as string, lines: [], ...overrides });

// ── Actores ───────────────────────────────────────────────────────────────────────
export const anActor = (overrides: Partial<Actor> = {}): Actor => ({ id: 'u2', role: 'manager', ...overrides });
export const anAdmin = (overrides: Partial<Actor> = {}): Actor => anActor({ id: 'u1', role: 'admin', ...overrides });
export const aManager = (overrides: Partial<Actor> = {}): Actor => anActor({ id: 'u2', role: 'manager', ...overrides });
export const anAgent = (overrides: Partial<Actor> = {}): Actor => anActor({ id: 'u3', role: 'agent', ...overrides });

// ── DTOs del backend ──────────────────────────────────────────────────────────────
/** La forma que llega por la red, con los nombres del backend heredado. Para probar la frontera. */
const BASE_DTO: OrderDto = {
  ord_id: 'P-1000',
  cust_nm: 'Cliente de prueba',
  cust_tier: 'standard',
  ord_st: 'pending',
  owner_id: 'u2',
  crt_ts: '2026-11-02T09:00:00Z',
  ln_items: [{ sku: 'A-10', qty: 1, unit_prc: 100 }],
};

export function aDto(overrides: Partial<OrderDto> = {}): OrderDto {
  return { ...structuredClone(BASE_DTO), ...structuredClone(overrides) };
}

/** Sesión 6 · Lo que el BFF responde a un AGENTE: sin `owner_id` y con `ln_items` vacío. */
export function aTrimmedDto(overrides: Partial<OrderDto> = {}): Omit<OrderDto, 'owner_id'> {
  const { owner_id: _omit, ...rest } = aDto({ ln_items: [], ...overrides });
  return rest;
}
