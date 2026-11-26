// PRUEBAS · Pedidos con nombre, en el lenguaje del dominio. Mismos datos que el arnés de la caracterización
// (src/pages/returns-harness.tsx) y que server/returns-legacy.mjs: los mismos números en los tres niveles.
import type { ReturnableOrder } from '../domain/returnable-order';

/** Standard, 3 × E-50 a 140 €, 1 ya devuelta, entregado el 12/11. */
export const P1004: ReturnableOrder = { orderId: 'P-1004', customerName: 'Clínica Dental Mar', tier: 'standard', lines: [{ sku: 'E-50', ordered: 3, unitPrice: 140, alreadyReturned: 1 }], delivery: { trackingNumber: 'TRK-88412', deliveredAt: '2026-11-12T10:00:00Z' } };
/** Gold, importes altos: para el límite de 500 € del manager. */
export const GOLD: ReturnableOrder = { orderId: 'P-2001', customerName: 'Construcciones Vega', tier: 'gold', lines: [{ sku: 'D-40', ordered: 10, unitPrice: 95, alreadyReturned: 0 }, { sku: 'A-10', ordered: 4, unitPrice: 32.5, alreadyReturned: 0 }], delivery: { trackingNumber: 'TRK-90001', deliveredAt: '2026-11-20T10:00:00Z' } };
/** Aprobado y en camino: el transportista no lo da por entregado. */
export const IN_TRANSIT: ReturnableOrder = { orderId: 'P-1002', customerName: 'Ferretería Sol', tier: 'silver', lines: [{ sku: 'C-30', ordered: 12, unitPrice: 18, alreadyReturned: 0 }], delivery: null };

export const at = (iso: string) => ({ now: () => new Date(iso) });
/** Lunes 30 de noviembre de 2026, 18:00 en Madrid. */
export const CLASS_DAY = at('2026-11-30T17:00:00Z');
