// PRESENTACIÓN · View model del detalle de un pedido (Sesión 7). Función PURA: sin React y sin router.
// Nace de src/pages/OrderDetailPage.tsx y tiene que conservar su comportamiento visible, que fijan los tests de
// caracterización (src/pages/order-detail.characterization.test.tsx). Lo que cambia, cambia a propósito y está en el test.
import type { Actor } from '../domain/cancellation';
import type { Order } from '../domain/order';

export type OrderDetailViewModel = {
  title: string;
  status: { label: string; danger: boolean };
  subtitle: string;
  lines: { sku: string; quantity: string; unitPrice: string; amount: string }[];
  note: string | null;
  total: string | null;
  canCancel: boolean;
};

export function buildOrderDetailViewModel(_order: Order, _actor: Actor | null): OrderDetailViewModel {
  throw new Error('Por implementar (Ejercicio S7 · Parte B)');
}
