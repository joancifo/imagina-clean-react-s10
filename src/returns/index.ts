// API PÚBLICA de la feature Devoluciones (Sesión 10).
// Como en Pedidos: el código de fuera de src/returns importa SOLO desde aquí: import { … } from '../returns'.
// Se ha ido llenando paso a paso (docs/devoluciones/plan.md).

// Paso 2 · reglas puras
export { canManageReturns, chargesRestocking, isWithinReturnWindow, needsAdminApproval, refundFor, remainingQuantity, RETURN_REASONS, type RefundInput, type ReturnReason } from './domain/return-rules';

// Paso 4 · composición: main.tsx y los tests eligen adapters y crean el módulo una vez
export { createHttpReturnsAdapters, createReturnsModule, type ReturnsAdapters, type ReturnsModule } from './composition';
export { createInMemoryReturnsGateway } from './infrastructure/in-memory-returns-gateway';
export type { ReturnableOrder } from './domain/returnable-order';

// Paso 5 · pantalla nueva (detrás del flag newReturns, en src/shell/ReturnsRoute.tsx)
export { ReturnsScreen } from './ui/ReturnsScreen';
export { ReturnsProvider } from './ui/ReturnsProvider';
