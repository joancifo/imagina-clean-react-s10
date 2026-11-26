// PRESENTACIÓN · View model del formulario de devolución: función pura, sin React. Mismos textos que la heredada
// (lo exige la red de caracterización); el reembolso que se enseña es una ESTIMACIÓN: el que vale lo confirma el BFF.
import { chargesRestocking, needsAdminApproval, refundFor, type ReturnReason } from '../domain/return-rules';
import { remainingOf, type ReturnableOrder } from '../domain/returnable-order';
import { formatCurrency, formatDate } from './formatters';

export type ReturnDraft = { sku: string; quantity: number; reason: ReturnReason };

export const REASON_OPTIONS: ReadonlyArray<{ value: ReturnReason; label: string }> = [
  { value: 'NO_LONGER_NEEDED', label: 'Ya no lo necesita' },
  { value: 'DEFECTIVE', label: 'Defectuoso' },
  { value: 'WRONG_ITEM', label: 'Artículo equivocado' },
];

export const initialDraft = (order: ReturnableOrder): ReturnDraft => ({ sku: order.lines[0]?.sku ?? '', quantity: 1, reason: 'NO_LONGER_NEEDED' });

export function buildReturnFormViewModel(order: ReturnableOrder, draft: ReturnDraft, role: string) {
  const line = order.lines.find((item) => item.sku === draft.sku);
  const max = line ? remainingOf(line) : 0;
  const refund = line ? refundFor({ unitPrice: line.unitPrice, quantity: draft.quantity, tier: order.tier, reason: draft.reason }) : 0;
  const needsAdmin = needsAdminApproval(role, refund);
  return {
    title: `Devolución del pedido ${order.orderId}`,
    subtitle: order.delivery ? `${order.customerName} · entregado el ${formatDate(order.delivery.deliveredAt)} · seguimiento ${order.delivery.trackingNumber}` : order.customerName,
    lines: order.lines.map((item) => ({ value: item.sku, label: `${item.sku} (${item.ordered} uds.)` })),
    remaining: `Ya devueltas: ${line?.alreadyReturned ?? 0} · Puedes devolver hasta ${max}`,
    max,
    refund: `Reembolso: ${formatCurrency(refund)}`,
    restockingNote: chargesRestocking(order.tier, draft.reason) ? 'Incluye gastos de reposición del 15 %' : null,
    needsAdmin,
    canSubmit: max > 0 && !needsAdmin,
  };
}

export type ReturnFormViewModel = ReturnType<typeof buildReturnFormViewModel>;
