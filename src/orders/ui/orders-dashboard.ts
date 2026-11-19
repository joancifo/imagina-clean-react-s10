// PRESENTACIÓN · Métricas del panel (Sesión 7). Función PURA y de UNA sola pasada sobre los pedidos.
// Sustituye a los cálculos de src/pages/DashboardPage.tsx, que tenía su propio mapper y su propia fórmula del total
// (sin descuento por nivel). Aquí el total sale del dominio: la facturación cambia A PROPÓSITO (bug corregido)
// y el test de caracterización del panel lo deja escrito.
import { canCancel, type Actor } from '../domain/cancellation';
import { calculateTotal, type Order } from '../domain/order';
import { formatCurrency } from './formatters';

export type DashboardMetrics = { pending: number; revenue: string; cancellable: number };

export function buildDashboardMetrics(orders: Order[], actor: Actor | null): DashboardMetrics {
  let pending = 0;
  let revenue = 0;
  let cancellable = 0;
  for (const order of orders) {
    if (order.status === 'pending') pending += 1;
    if (order.status === 'approved' || order.status === 'shipped') revenue += calculateTotal(order);
    if (canCancel(order, actor)) cancellable += 1;
  }
  return { pending, revenue: formatCurrency(revenue), cancellable };
}
