// API PÚBLICA de la feature Pedidos.
// El código de fuera de src/orders importa SOLO desde aquí: import { … } from '../orders'.
// Lo que no se exporta es interno y puede cambiar sin avisar a nadie (eslint.boundaries.js lo hace cumplir).

// Sesión 3 · motivo de cancelación
export { createCancellationReason, type CancellationReason, type ReasonError } from './domain/cancellation-reason';
export { CANCELLATION_MESSAGES } from './ui/cancellation-messages';

// Sesión 3 · regla oficial de cancelación
export { canCancel, cancelOrder, type Actor, type CancellationDenied, type OrderCancelled } from './domain/cancellation';

// Sesión 4 · composición: el arranque (src/main.tsx) y los tests eligen adapters y crean el módulo UNA vez
export { createHttpAdapters, createInMemoryAdapters, createOrdersModule, type OrdersAdapters, type OrdersModule } from './composition';
export { OrdersProvider, useOrdersModule } from './ui/OrdersProvider';
export type { CancelOrderCommand, CancelOrderError } from './application/cancel-order';

// Sesión 4 · hooks adaptadores para las pantallas
export { useCancelOrder, type CancelOutcome } from './ui/useCancelOrder';
export { useOrderSummary } from './ui/useOrderSummary';

// Sesión 5 · capa de presentación: pantalla de la lista, permisos de acceso y aprobación
export { OrdersListPage } from './ui/OrdersListPage';
export { canSeeAmounts, canViewDashboard, canViewOrders } from './domain/permissions';
export { useApproveOrder, type ApproveOutcome } from './ui/useApproveOrder';
export type { ApproveOrderCommand, ApproveOrderError } from './application/approve-order';

// Puente TEMPORAL para el código heredado (src/pages…): traduce sus modelos al dominio.
// Sesión 5: la lista ya no lo usa. Desaparece cuando se migren el detalle y el panel (proyecto final).
export { toOrder } from './infrastructure/order-mapper';
export { toActor } from './infrastructure/actor-mapper';
