// TEMA 17 · Invariantes: lo que tiene que seguir siendo cierto PASE LO QUE PASE.
// Un test de ejemplo comprueba un caso. Un test de invariante comprueba una propiedad sobre MUCHOS casos,
// generados a partir del builder. No hace falta una librería: basta con un bucle y datos construidos.
import { cancelOrder } from '../../src/orders/domain/cancellation';
import { calculateTotal, type CustomerTier, type OrderStatus } from '../../src/orders/domain/order';
import { aFixedClock, anAdmin, anOrder } from '../../src/orders/testing';

const NOW = aFixedClock().now();
const REASON = 'Cliente duplicado en el ERP' as never;

const TIERS: CustomerTier[] = ['gold', 'silver', 'standard'];
const CANCELLABLE: OrderStatus[] = ['pending', 'approved'];

/** Todas las combinaciones que un builder puede producir y el dominio tiene que aguantar. */
function* everyCancellableOrder() {
  for (const customerTier of TIERS)
    for (const status of CANCELLABLE)
      for (const quantity of [1, 7, 60])
        for (const unitPrice of [0.01, 32.5, 12000])
          yield anOrder({ customerTier, status, lines: [{ sku: 'A-10', quantity, unitPrice }] });
}

describe('invariantes de la cancelación', () => {
  it('cancelar no cambia el identificador, el cliente ni el importe', () => {
    for (const order of everyCancellableOrder()) {
      const result = cancelOrder(order, anAdmin(), REASON, NOW);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.order.id).toBe(order.id);
      expect(result.value.order.customerName).toBe(order.customerName);
      expect(calculateTotal(result.value.order)).toBeCloseTo(calculateTotal(order), 10);
    }
  });

  it('el evento siempre apunta al pedido que se ha cancelado y a quien lo pidió', () => {
    for (const order of everyCancellableOrder()) {
      const result = cancelOrder(order, anAdmin({ id: 'u9' }), REASON, NOW);
      if (!result.ok) throw new Error('se esperaba poder cancelar');
      expect(result.value.event).toMatchObject({ type: 'OrderCancelled', orderId: order.id, cancelledBy: 'u9' });
    }
  });

  it('el total nunca es negativo ni NaN, con cualquier combinación de descuento e IVA', () => {
    for (const order of everyCancellableOrder()) {
      const total = calculateTotal(order);
      expect(Number.isFinite(total)).toBe(true);
      expect(total).toBeGreaterThanOrEqual(0);
    }
  });
});
