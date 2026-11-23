// TEMA 17 · Probar una transición de estado es probar TAMBIÉN las que no se permiten.
// La mitad olvidada de cualquier máquina de estados son las flechas que no existen.
import { approveOrder } from '../../src/orders/domain/approval';
import { cancelOrder } from '../../src/orders/domain/cancellation';
import { aFixedClock, anAdmin, anOrder } from '../../src/orders/testing';
import type { OrderStatus } from '../../src/orders/domain/order';

const NOW = aFixedClock().now();
const REASON = 'Cliente duplicado en el ERP' as never;

type Expectation = { from: OrderStatus; approve: boolean; cancel: boolean };

// La tabla ENTERA: cuatro estados × dos acciones. Ocho casillas, ninguna en blanco.
const TABLE: Expectation[] = [
  { from: 'pending', approve: true, cancel: true },
  { from: 'approved', approve: false, cancel: true },
  { from: 'shipped', approve: false, cancel: false },
  { from: 'cancelled', approve: false, cancel: false },
];

describe('transiciones del pedido, vistas por un administrador', () => {
  it.each(TABLE)('desde $from: aprobar=$approve · cancelar=$cancel', ({ from, approve, cancel }) => {
    const order = anOrder({ status: from });
    expect(approveOrder(order, anAdmin(), NOW).ok).toBe(approve);
    expect(cancelOrder(order, anAdmin(), REASON, NOW).ok).toBe(cancel);
  });

  it('una transición válida devuelve un pedido NUEVO y no toca el original', () => {
    const order = Object.freeze(anOrder());
    const result = cancelOrder(order, anAdmin(), REASON, NOW);
    expect(result.ok && result.value.order.status).toBe('cancelled');
    expect(order.status).toBe('pending'); // si mutara, Object.freeze habría lanzado antes
  });

  it('el evento lleva la hora que le dan, no la del sistema', () => {
    const result = cancelOrder(anOrder(), anAdmin(), REASON, NOW);
    expect(result.ok && result.value.event.occurredAt).toBe(NOW.toISOString());
  });
});
