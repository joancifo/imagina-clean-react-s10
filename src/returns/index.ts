// API PÚBLICA de la feature Devoluciones (Sesión 10).
// Como en Pedidos: el código de fuera de src/returns importa SOLO desde aquí: import { … } from '../returns'.
// Paso 2 del plan: reglas puras. Lo demás llega paso a paso (docs/devoluciones/plan.md).
export { canManageReturns, chargesRestocking, isWithinReturnWindow, needsAdminApproval, refundFor, remainingQuantity, RETURN_REASONS, type RefundInput, type ReturnReason } from './domain/return-rules';
