// INFRAESTRUCTURA · Traduce DTO → dominio. Si el backend renombra un campo, solo cambia este archivo.
// Sesión 8 · La traducción se separa de la VALIDACIÓN (order-dto.ts): primero «¿me puedo fiar de esto?»,
// después «¿cómo se llama esto en nuestro lenguaje?». Mezclarlas hace que ninguna se pueda probar sola.
import type { CustomerTier, Order, OrderStatus } from '../domain/order';
import { type Result } from '../domain/result';
import { CUSTOMER_TIERS, ORDER_STATUSES, type DtoProblem, type OrderDto } from './order-dto';

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
    // Ejercicio S8 · Parte A · ESTE `as` es el fallo de hoy. El BFF NO envía `owner_id` a un agente,
    // así que aquí entra `undefined` disfrazado de string y la lista «Solo míos» se queda vacía
    // sin que nadie se entere. El compilador no puede ayudar: le hemos dicho que se calle.
    ownerId: dto.owner_id as string,
    createdAt: dto.crt_ts,
    lines: dto.ln_items.map((line) => ({ sku: line.sku, quantity: line.qty, unitPrice: line.unit_prc })),
    // Sesión 7 · Solo si llega y es texto: un campo opcional del backend no se convierte en «undefined» escrito.
    ...(typeof dto.cust_note === 'string' ? { customerNote: dto.cust_note } : {}),
  };
}

/** Ejercicio S8 · Parte A · Lo que usan los adapters: valida (parseOrderDto) y traduce (toOrder).
 *  Un solo sitio por el que entran los datos de fuera. */
export function parseOrder(_raw: unknown): Result<Order, DtoProblem> {
  throw new Error('Por implementar · Ejercicio S8, Parte A');
}

/** Ejercicio S8 · Parte A · Lista completa: si UNA fila no es utilizable, no se enseña media lista con
 *  datos inventados. El campo del problema lleva delante la posición: `[2].ln_items[0].qty`. */
export function parseOrders(_raw: unknown): Result<Order[], DtoProblem> {
  throw new Error('Por implementar · Ejercicio S8, Parte A');
}
