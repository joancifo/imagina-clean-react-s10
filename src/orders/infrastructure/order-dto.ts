// INFRAESTRUCTURA · Forma del backend heredado Y su validación en tiempo de EJECUCIÓN.
// Solo existe aquí: el resto de la aplicación no la ve.
//
// Sesión 8 · Por qué hay un parser y no un `as OrderDto`:
// TypeScript comprueba lo que escribimos NOSOTROS. No comprueba nada de lo que llega por la red.
// `const dto: OrderDto = await response.json()` es una promesa que nadie ha verificado: si el backend
// cambia un nombre, recorta un campo o envía un número como texto, el error no aparece aquí —
// aparece tres capas más adentro, con otro nombre y sin pistas.
import { err, ok, type Result } from '../domain/result';

export type OrderDtoLine = { sku: string; qty: number; unit_prc: number };

export type OrderDto = {
  ord_id: string;
  cust_nm: string;
  cust_tier: string;
  ord_st: string;
  /** Sesión 6 · El BFF NO envía el responsable a un agente: el campo puede no llegar. */
  owner_id?: string;
  crt_ts: string;
  ln_items: OrderDtoLine[];
  /** Sesión 7 · La usa el detalle. Opcional en el backend. */
  cust_note?: string;
};

/** Qué campo falla y por qué. Un mensaje para quien depura, no para quien usa la aplicación. */
export type DtoProblem = {
  field: string;
  reason: 'missing' | 'type' | 'value';
};

export const ORDER_STATUSES = ['pending', 'approved', 'shipped', 'cancelled'] as const;
export const CUSTOMER_TIERS = ['gold', 'silver', 'standard'] as const;

/** Campos que conocemos. Lo que no está aquí NO entra: un campo nuevo del backend no rompe al cliente,
 *  pero tampoco se cuela en el dominio sin que nadie lo haya decidido (lista blanca, como en el BFF). */
const REQUIRED_TEXT = ['ord_id', 'cust_nm', 'cust_tier', 'ord_st', 'crt_ts'] as const;
const OPTIONAL_TEXT = ['owner_id', 'cust_note'] as const;

const isText = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const problemFor = (field: string, value: unknown): DtoProblem => ({ field, reason: value === undefined ? 'missing' : 'type' });

function parseLine(raw: unknown, index: number): Result<OrderDtoLine, DtoProblem> {
  const at = (field: string) => `ln_items[${index}].${field}`;
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return err({ field: `ln_items[${index}]`, reason: raw === undefined ? 'missing' : 'type' });
  const line = raw as Record<string, unknown>;
  if (!isText(line.sku)) return err(problemFor(at('sku'), line.sku));
  // Un «40» en texto no es 40: multiplicarlo por un precio da NaN, y un NaN viaja muy lejos antes de verse.
  if (!isNumber(line.qty)) return err(problemFor(at('qty'), line.qty));
  if (!isNumber(line.unit_prc)) return err(problemFor(at('unit_prc'), line.unit_prc));
  return ok({ sku: line.sku, qty: line.qty, unit_prc: line.unit_prc });
}

/**
 * Ejercicio S8 · Parte A · Comprueba que lo que ha llegado tiene la forma del DTO y devuelve SOLO los
 * campos conocidos. No traduce al dominio (eso es order-mapper.ts): aquí se decide si el dato es utilizable.
 *
 * Qué tiene que comprobar, en este orden (el orden importa: el primer problema que encuentra, lo devuelve):
 *   1. que `raw` sea un objeto (ni null, ni un array, ni una cadena: una respuesta de fuera puede ser cualquier cosa);
 *   2. que cada campo de REQUIRED_TEXT esté y sea texto           → problemFor(campo, valor)
 *   3. que cada campo de OPTIONAL_TEXT, SI está, sea texto        → { field, reason: 'type' }
 *   4. que `ln_items` sea un array, y cada línea, con parseLine   → ya escrito más arriba
 *   5. que `ord_st` y `cust_tier` sean valores que conocemos      → { field, reason: 'value' }
 *   6. devolver un objeto NUEVO con los campos conocidos y nada más (lista blanca),
 *      poniendo `owner_id` y `cust_note` solo si han llegado como texto.
 */
export function parseOrderDto(_raw: unknown): Result<OrderDto, DtoProblem> {
  throw new Error('Por implementar · Ejercicio S8, Parte A');
}

/** Mensaje técnico uniforme para logs y errores de adapter. Nunca se enseña en pantalla. */
export const describeProblem = ({ field, reason }: DtoProblem): string =>
  `Respuesta inesperada del backend: ${field} (${{ missing: 'no llega', type: 'tipo incorrecto', value: 'valor desconocido' }[reason]})`;
