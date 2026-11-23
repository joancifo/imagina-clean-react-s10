// INFRAESTRUCTURA · Traduce DTO → dominio. Si el backend renombra un campo, solo cambia este archivo.
// Sesión 8 · La traducción se separa de la VALIDACIÓN (order-dto.ts): primero «¿me puedo fiar de esto?»,
// después «¿cómo se llama esto en nuestro lenguaje?». Mezclarlas hace que ninguna se pueda probar sola.
import type { CustomerTier, Order, OrderStatus } from '../domain/order';
import { err, ok, type Result } from '../domain/result';
import { CUSTOMER_TIERS, ORDER_STATUSES, parseOrderDto, type DtoProblem, type OrderDto } from './order-dto';

const inSet = <T extends string>(value: string, allowed: readonly T[]): value is T => (allowed as readonly string[]).includes(value);

/**
 * DTO ya validado → modelo de dominio. Sigue comprobando los dos valores de vocabulario
 * porque la llama también el código heredado, que no pasa por parseOrderDto.
 */
export function toOrder(dto: OrderDto): Order {
  if (!inSet(dto.ord_st, ORDER_STATUSES)) throw new Error(`Valor inesperado en ord_st: ${dto.ord_st}`);
  if (!inSet(dto.cust_tier, CUSTOMER_TIERS)) throw new Error(`Valor inesperado en cust_tier: ${dto.cust_tier}`);
  return {
    id: dto.ord_id,
    customerName: dto.cust_nm,
    customerTier: dto.cust_tier as CustomerTier,
    status: dto.ord_st as OrderStatus,
    // Sesión 8 · El BFF recorta el responsable para un agente. «No lo sé» se dice con null, no con undefined
    // ni con una cadena vacía: quien lo lea tiene que decidir qué hacer, y el compilador se lo recuerda.
    ownerId: dto.owner_id ?? null,
    createdAt: dto.crt_ts,
    lines: dto.ln_items.map((line) => ({ sku: line.sku, quantity: line.qty, unitPrice: line.unit_prc })),
    // Sesión 7 · Solo si llega y es texto: un campo opcional del backend no se convierte en «undefined» escrito.
    ...(typeof dto.cust_note === 'string' ? { customerNote: dto.cust_note } : {}),
  };
}

/** Lo que usan los adapters: valida y traduce. Un solo sitio por el que entran los datos de fuera. */
export function parseOrder(raw: unknown): Result<Order, DtoProblem> {
  const dto = parseOrderDto(raw);
  return dto.ok ? ok(toOrder(dto.value)) : err(dto.error);
}

/** Lista completa: si UNA fila no es utilizable, no se enseña media lista con datos inventados. */
export function parseOrders(raw: unknown): Result<Order[], DtoProblem> {
  if (!Array.isArray(raw)) return err({ field: '(raíz)', reason: raw === undefined ? 'missing' : 'type' });
  const orders: Order[] = [];
  for (const [index, item] of raw.entries()) {
    const order = parseOrder(item);
    if (!order.ok) return err({ ...order.error, field: `[${index}].${order.error.field}` });
    orders.push(order.value);
  }
  return ok(orders);
}
