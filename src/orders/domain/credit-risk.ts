// DOMINIO · Domain service: una regla que no pertenece a UN pedido, sino a varios.
// Origen: src/pages/OrdersPage.tsx (resumen) · «pendingAmount > 20000 → Revisar riesgo de crédito».
// CUÁNDO hay riesgo es negocio y vive aquí. QUIÉN ve el aviso es presentación (view model).
import { calculateTotal, type Order } from './order';

export const CREDIT_REVIEW_FROM = 20000;

export function pendingExposure(orders: readonly Order[]): number {
  return orders.filter((order) => order.status === 'pending').reduce((sum, order) => sum + calculateTotal(order), 0);
}

export function needsCreditReview(orders: readonly Order[]): boolean {
  return pendingExposure(orders) > CREDIT_REVIEW_FROM;
}
