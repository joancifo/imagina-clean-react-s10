// DOMINIO · Conceptos y reglas del negocio. No conoce React, HTTP, router ni almacenamiento.
// Sesión 6: los NÚMEROS (IVA, descuentos, umbrales) salen de shared/policy.json, el mismo archivo que lee el BFF.
// El código de la regla sigue viviendo aquí: se comparte el dato, no la implementación.
import policy from '../../../shared/policy.json';
export type OrderStatus = 'pending' | 'approved' | 'shipped' | 'cancelled';
export type CustomerTier = 'gold' | 'silver' | 'standard';
export type OrderLine = { sku: string; quantity: number; unitPrice: number };

export type Order = {
  id: string;
  customerName: string;
  customerTier: CustomerTier;
  status: OrderStatus;
  /** Sesión 8 · null = el backend NO nos ha dicho quién es (a un agente le recorta este campo).
   *  Un tipo que promete un string cuando puede no llegar es un tipo que miente. */
  ownerId: string | null;
  createdAt: string; // ISO 8601
  lines: OrderLine[];
  /** Sesión 7 · Nota que escribe el cliente. Texto libre: se pinta como texto y nunca viaja a logs ni analítica. */
  customerNote?: string;
};

const DISCOUNT_BY_TIER: Record<CustomerTier, number> = policy.pricing.discountByTier;
const VAT = policy.pricing.vat;
export const URGENT_FROM = policy.urgency.from;

export function calculateTotal(order: Pick<Order, 'lines' | 'customerTier'>): number {
  const subtotal = order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  return subtotal * (1 - DISCOUNT_BY_TIER[order.customerTier]) * (1 + VAT);
}

export function isUrgent(order: Order): boolean {
  return order.status === 'pending' && calculateTotal(order) > URGENT_FROM;
}
