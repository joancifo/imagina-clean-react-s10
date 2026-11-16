// PRESENTACIÓN · View model de la lista de pedidos: convierte dominio + criterios + actor en datos LISTOS PARA PINTAR.
// Sustituye a los Efectos 3 y 4 de la pantalla heredada (estado derivado sincronizado con useEffect)
// y a las condiciones repartidas por el JSX (user?.usr_role !== 'agent', total > 3000…).
// Función pura: se calcula en cada render. Sin React, sin estado, sin efectos.
import type { Actor } from '../domain/cancellation';
import type { Order, OrderStatus } from '../domain/order';
import type { OrdersCriteria } from './orders-criteria';
// Reglas del dominio que necesitarás (no las reescribas):
//   canApprove (domain/approval) · canCancel (domain/cancellation) · needsCreditReview, pendingExposure (domain/credit-risk)
//   calculateTotal, isUrgent (domain/order) · canSeeAmounts (domain/permissions) · formatCurrency, formatDate (./formatters)

export type OrderRowViewModel = {
  id: string;
  customer: string;
  date: string;
  /** null = este actor no ve responsables. */
  owner: string | null;
  statusLabel: string;
  tone: 'normal' | 'urgent' | 'muted';
  /** null = este actor no ve importes. El dato no llega al componente: no basta con ocultar la columna. */
  total: string | null;
  canApprove: boolean;
  canCancel: boolean;
};

export type OrdersListViewModel = {
  summary: string;
  showAmounts: boolean;
  rows: OrderRowViewModel[];
  /** null cuando hay filas. */
  emptyMessage: string | null;
};

export const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  shipped: 'Enviado',
  cancelled: 'Cancelado',
} satisfies Record<OrderStatus, string>;

// Ejercicio S5 · Parte A: filtra, ordena, resume y prepara cada fila. La especificación es orders-list-view-model.test.ts.
export function buildOrdersListViewModel(orders: readonly Order[], criteria: OrdersCriteria, actor: Actor | null): OrdersListViewModel {
  void [orders, criteria, actor];
  throw new Error('Por implementar (ejercicio S5 · Parte A)');
}
