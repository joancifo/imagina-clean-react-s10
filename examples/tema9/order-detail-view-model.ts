// TEMA 9 · View model (presenter): convierte un pedido del dominio en los datos exactos de la pantalla de detalle.
// Origen: src/pages/OrderDetailPage.tsx calcula el total con un useEffect + useState y multiplica en el JSX.
// El JSX que consume este view model no tiene ni un cálculo, ni un ternario de negocio, ni un formateo.
import { calculateTotal, type Order } from '../../src/orders/domain/order';
import { formatCurrency, formatDate } from '../../src/orders/ui/formatters';

export type OrderDetailViewModel = {
  title: string;
  subtitle: string;
  lines: { sku: string; quantity: string; unitPrice: string; amount: string }[];
  total: string;
};

const TIER_LABELS = { gold: 'Cliente Gold (10 % dto.)', silver: 'Cliente Silver (5 % dto.)', standard: 'Cliente estándar' } satisfies Record<Order['customerTier'], string>;

export function toOrderDetailViewModel(order: Order): OrderDetailViewModel {
  return {
    title: `Pedido ${order.id}`,
    subtitle: `${order.customerName} · ${formatDate(order.createdAt)} · ${TIER_LABELS[order.customerTier]}`,
    lines: order.lines.map((line) => ({
      sku: line.sku,
      quantity: String(line.quantity),
      unitPrice: formatCurrency(line.unitPrice),
      amount: formatCurrency(line.quantity * line.unitPrice),
    })),
    total: `Total con IVA: ${formatCurrency(calculateTotal(order))}`,
  };
}
