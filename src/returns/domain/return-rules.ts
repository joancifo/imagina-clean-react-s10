// Sesión 10 · Laboratorio · Fase 4 · ESQUELETO del primer paso del plan: las reglas de Devoluciones, como funciones PURAS.
// Hoy viven dentro de src/pages/ReturnsPage.tsx, mezcladas con fetch, estado y JSX. Aquí no entra nada de eso:
// sin React, sin fetch y sin Date.now() (la fecha llega por parámetro).
//
// Regla de oro de este paso: se copian TAL CUAL, rarezas incluidas. Un refactor no cambia comportamiento.
// Si una regla te parece un error, no la arregles: apúntala como pregunta en docs/devoluciones/plan.md.
// Comprobación: quita el .skip de return-rules.test.ts → npm run lab:rules · después, npm run lab:red (la caracterización).
import policy from '../../../shared/policy.json';

export type ReturnReason = 'NO_LONGER_NEEDED' | 'DEFECTIVE' | 'WRONG_ITEM';

const DISCOUNT_BY_TIER: Record<string, number> = policy.pricing.discountByTier; // gold 0.1 · silver 0.05 · standard 0
const VAT = policy.pricing.vat; // 0.21
const WINDOW_DAYS = 30; // Paso 3 del plan: a shared/policy.json, para que el BFF use el mismo número
const RESTOCKING_FEE = 0.15;
const MANAGER_REFUND_LIMIT = 500;
const HOUR = 3_600_000;

/** HUECO 1 · ¿Paga gastos de reposición? Busca la condición en ReturnsPage.tsx (aparece DOS veces: en el efecto y en el JSX). */
export function chargesRestocking(tier: string, reason: ReturnReason): boolean {
  throw new Error('Fase 4 · HUECO 1 sin hacer');
}

export type RefundInput = { unitPrice: number; quantity: number; tier: string; reason: ReturnReason };

/** HUECO 2 · Importe a devolver, redondeado a céntimos. Es el segundo useEffect de ReturnsPage.tsx.
 *  Usa DISCOUNT_BY_TIER, VAT, RESTOCKING_FEE y chargesRestocking(). */
export function refundFor({ unitPrice, quantity, tier, reason }: RefundInput): number {
  throw new Error('Fase 4 · HUECO 2 sin hacer');
}

/** HUECO 3 · ¿Dentro de plazo? En la pantalla: `days > 30` con `Date.now()`. Aquí, `now` llega por parámetro. */
export function isWithinReturnWindow(deliveredAt: string, now: Date): boolean {
  throw new Error('Fase 4 · HUECO 3 sin hacer');
}

/** HUECO 4 · Unidades que aún se pueden devolver de una línea: pedidas menos ya devueltas. */
export function remainingQuantity(ordered: number, alreadyReturned: ReadonlyArray<number>): number {
  throw new Error('Fase 4 · HUECO 4 sin hacer');
}

/** HUECO 5 (si te sobra tiempo) · ¿Necesita un admin? En la pantalla: `needsAdmin`. */
export function needsAdminApproval(role: string, amount: number): boolean {
  throw new Error('Fase 4 · HUECO 5 sin hacer');
}

/** Ya hecho: el modelo. Así de pequeña es una regla pura con nombre de negocio. */
export const canManageReturns = (role: string): boolean => role === 'admin' || role === 'manager';
