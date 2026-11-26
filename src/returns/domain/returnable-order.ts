// DOMINIO · Un pedido visto desde Devoluciones (paso 4 del plan). Nombres de negocio: ni ord_id, ni trk_no, ni dlv_ts.
import { remainingQuantity, isWithinReturnWindow } from './return-rules';

export type ReturnableLine = { sku: string; ordered: number; unitPrice: number; alreadyReturned: number };

export type ReturnableOrder = {
  orderId: string;
  customerName: string;
  tier: string;
  lines: ReturnableLine[];
  /** null = no consta como entregado (en camino o sin datos del transportista). */
  delivery: { trackingNumber: string; deliveredAt: string } | null;
};

export type ReturnWindow = 'open' | 'not-delivered' | 'closed';

/** ¿Se puede abrir una devolución hoy? La fecha llega por parámetro. */
export function returnWindowOf(order: ReturnableOrder, now: Date): ReturnWindow {
  if (order.delivery === null) return 'not-delivered';
  return isWithinReturnWindow(order.delivery.deliveredAt, now) ? 'open' : 'closed';
}

export const remainingOf = (line: ReturnableLine): number => remainingQuantity(line.ordered, [line.alreadyReturned]);
