// DOMINIO · Reglas de las devoluciones, extraídas de src/pages/ReturnsPage.tsx (Sesión 10 · paso 2 del plan).
// Funciones PURAS: sin React, sin fetch y sin Date.now(). La fecha llega por parámetro.
// Se extrajeron TAL CUAL, rarezas incluidas: un refactor no cambia comportamiento. Las rarezas están en
// docs/devoluciones/plan.md como preguntas a Producto; si se decide cambiar alguna, será otro PR, con su test.
import policy from '../../../shared/policy.json';

export type ReturnReason = 'NO_LONGER_NEEDED' | 'DEFECTIVE' | 'WRONG_ITEM';
export const RETURN_REASONS: ReadonlyArray<ReturnReason> = ['NO_LONGER_NEEDED', 'DEFECTIVE', 'WRONG_ITEM'];

const DISCOUNT_BY_TIER: Record<string, number> = policy.pricing.discountByTier;
const VAT = policy.pricing.vat;
const { windowDays, restockingFee, managerRefundLimit } = policy.returns;
const HOUR = 3_600_000;

/** ¿Paga gastos de reposición? Todo lo que no es «defectuoso», salvo gold.
 *  RAREZA (plan.md, pregunta 1): «artículo equivocado» también paga, aunque el error sea nuestro. */
export function chargesRestocking(tier: string, reason: ReturnReason): boolean {
  return reason !== 'DEFECTIVE' && tier !== 'gold';
}

export type RefundInput = { unitPrice: number; quantity: number; tier: string; reason: ReturnReason };

/** Importe a devolver, redondeado a céntimos: precio con descuento e IVA, menos la reposición.
 *  RAREZA (plan.md, pregunta 2): la reposición se calcula sobre el precio SIN descuento ni IVA. */
export function refundFor({ unitPrice, quantity, tier, reason }: RefundInput): number {
  const base = quantity * unitPrice;
  let amount = base * (1 - (DISCOUNT_BY_TIER[tier] ?? 0)) * (1 + VAT);
  if (chargesRestocking(tier, reason)) amount -= base * restockingFee;
  return Math.round(amount * 100) / 100;
}

/** ¿Está dentro de plazo? RAREZA (plan.md, pregunta 3): «30 días» son 30 × 24 horas desde la HORA de entrega. */
export function isWithinReturnWindow(deliveredAt: string, now: Date): boolean {
  return (now.getTime() - new Date(deliveredAt).getTime()) / HOUR <= windowDays * 24;
}

/** Unidades que aún se pueden devolver de una línea: pedidas menos ya devueltas. */
export function remainingQuantity(ordered: number, alreadyReturned: ReadonlyArray<number>): number {
  return ordered - alreadyReturned.reduce((sum, quantity) => sum + quantity, 0);
}

/** Un manager no registra reembolsos de más de 500 €: hace falta un admin. Un agente no gestiona devoluciones. */
export function needsAdminApproval(role: string, amount: number): boolean {
  return role === 'manager' && amount > managerRefundLimit;
}

export const canManageReturns = (role: string): boolean => role === 'admin' || role === 'manager';
