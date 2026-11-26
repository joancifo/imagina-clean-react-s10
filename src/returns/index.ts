// API PÚBLICA de la feature Devoluciones (Sesión 10).
// Como en Pedidos: el código de fuera de src/returns importa SOLO desde aquí: import { … } from '../returns'.
// Hoy solo exporta las reglas puras del primer paso del plan. Lo demás llegará paso a paso (docs/devoluciones/plan.md).
export { canManageReturns, chargesRestocking, isWithinReturnWindow, needsAdminApproval, refundFor, remainingQuantity, type RefundInput, type ReturnReason } from './domain/return-rules';
