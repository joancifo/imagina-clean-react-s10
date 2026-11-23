// PRESENTACIÓN · View model de la lista de pedidos: convierte dominio + criterios + actor en datos LISTOS PARA PINTAR.
// Sustituye a los Efectos 3 y 4 de la pantalla heredada (estado derivado sincronizado con useEffect)
// y a las condiciones repartidas por el JSX (user?.usr_role !== 'agent', total > 3000…).
// Función pura: se calcula en cada render. Sin React, sin estado, sin efectos.
import { canApprove } from '../domain/approval';
import { canCancel, type Actor } from '../domain/cancellation';
import { needsCreditReview, pendingExposure } from '../domain/credit-risk';
import { calculateTotal, isUrgent, type Order, type OrderStatus } from '../domain/order';
import { canSeeAmounts } from '../domain/permissions';
import { formatCurrency, formatDate } from './formatters';
import type { OrdersCriteria, SortKey } from './orders-criteria';

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
  /** Ejercicio S8 · Parte A · false = este actor no recibe el responsable del backend,
   *  así que no puede filtrar por él y la pantalla no debería ofrecérselo. */
  canFilterByOwner: boolean;
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

const COMPARATORS: Record<SortKey, (a: Order, b: Order) => number> = {
  date: (a, b) => a.createdAt.localeCompare(b.createdAt),
  total: (a, b) => calculateTotal(a) - calculateTotal(b),
  customer: (a, b) => a.customerName.localeCompare(b.customerName, 'es'),
};

function matches(criteria: OrdersCriteria, actor: Actor | null) {
  const text = criteria.text.trim().toLowerCase();
  return (order: Order): boolean =>
    (text === '' || order.customerName.toLowerCase().includes(text) || order.id.toLowerCase().includes(text)) &&
    (criteria.status === 'all' || order.status === criteria.status) &&
    (!criteria.onlyMine || order.ownerId === actor?.id);
}

function summarize(visible: Order[], actor: Actor | null, showAmounts: boolean): string {
  const pending = visible.filter((order) => order.status === 'pending');
  const urgent = pending.filter(isUrgent).length;
  return [
    showAmounts ? `${pending.length} pendientes por ${formatCurrency(pendingExposure(visible))}` : `${pending.length} pendientes`,
    urgent > 0 ? `${urgent} urgentes` : null,
    actor?.role === 'admin' && needsCreditReview(visible) ? 'Revisar riesgo de crédito' : null,
  ].filter(Boolean).join(' · ');
}

export function buildOrdersListViewModel(orders: readonly Order[], criteria: OrdersCriteria, actor: Actor | null): OrdersListViewModel {
  const visible = orders.filter(matches(criteria, actor)).sort(COMPARATORS[criteria.sort]); // filter ya devuelve una copia
  const showAmounts = canSeeAmounts(actor);
  const filtered = criteria.text.trim() !== '' || criteria.status !== 'all' || criteria.onlyMine;

  return {
    summary: summarize(visible, actor, showAmounts),
    showAmounts,
    canFilterByOwner: true, // Ejercicio S8 · Parte A · hoy siempre: por eso un agente ve un filtro que le vacía la lista

    rows: visible.map((order) => ({
      id: order.id,
      customer: order.customerName,
      date: formatDate(order.createdAt),
      owner: showAmounts ? (order.ownerId === actor?.id ? 'Yo' : order.ownerId) : null,
      statusLabel: STATUS_LABELS[order.status],
      tone: isUrgent(order) ? 'urgent' : order.status === 'cancelled' ? 'muted' : 'normal',
      total: showAmounts ? formatCurrency(calculateTotal(order)) : null,
      canApprove: canApprove(order, actor),
      canCancel: canCancel(order, actor),
    })),
    emptyMessage: visible.length > 0 ? null : filtered ? 'Sin resultados para estos filtros' : 'Todavía no hay pedidos',
  };
}
