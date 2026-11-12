// TEMA 7 · Caso de uso SÍNCRONO: «¿cuánto costará este pedido?» (vista previa en el formulario de alta).
// No necesita E/S, así que no es async. Misma forma que uno asíncrono: entrada explícita, Result de salida.
import { calculateTotal, type CustomerTier } from '../../src/orders/domain/order';
import { err, ok, type Result } from '../../src/orders/domain/result';

export type QuoteOrderInput = { customerTier: CustomerTier; lines: { sku: string; quantity: number; unitPrice: number }[] };
export type Quote = { lines: number; total: number };
export type QuoteError = 'no-lines' | 'invalid-quantity';

export function quoteOrder(input: QuoteOrderInput): Result<Quote, QuoteError> {
  if (input.lines.length === 0) return err('no-lines');
  if (input.lines.some((l) => !Number.isInteger(l.quantity) || l.quantity <= 0)) return err('invalid-quantity');
  return ok({ lines: input.lines.length, total: Math.round(calculateTotal(input) * 100) / 100 });
}

// ANTIPATRÓN · «Caso de uso» que solo reenvía: no añade intención, ni reglas, ni orquestación.
// Si lo único que hace es llamar a un puerto, sobra: la UI puede usar el puerto a través de un caso de uso con intención
// (loadOrderSummary, listUrgentOrders) o directamente un hook de datos (Sesión 5).
export const getOrdersUseCase = (reader: { findAll(): Promise<unknown[]> }) => reader.findAll();
