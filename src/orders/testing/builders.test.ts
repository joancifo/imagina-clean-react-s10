// @vitest-environment node
// Ejercicio S8 · Parte A · Los datos de prueba también se prueban.
// Un builder con un valor por defecto imposible (un pedido que el dominio nunca aceptaría, un DTO que el
// backend nunca enviaría) convierte toda la suite en una demostración sobre datos que no existen.
import { canCancel } from '../domain/cancellation';
import { calculateTotal, isUrgent } from '../domain/order';
import { MANAGER_CANCEL_LIMIT } from '../domain/cancellation';
import { parseOrderDto } from '../infrastructure/order-dto';
import { toOrder } from '../infrastructure/order-mapper';
import { aDto, aHugeOrder, aManager, anOrder, anOrderWithoutOwner, anUrgentOrder, aTrimmedDto } from './builders';

describe('Parte A · el kit de datos de prueba', () => {
  it('el pedido por defecto es un pedido que el dominio acepta', () => {
    const order = anOrder();
    expect(calculateTotal(order)).toBeCloseTo(121, 2); // 100 € · sin descuento · IVA 21 %
    expect(canCancel(order, aManager())).toBe(true);
    expect(isUrgent(order)).toBe(false);
  });

  it('cada llamada devuelve datos independientes: tocar uno no toca el otro', () => {
    const first = anOrder();
    const second = anOrder();
    first.lines[0].quantity = 999;
    expect(second.lines[0].quantity).toBe(1);
  });

  it('las madres cumplen lo que su nombre promete', () => {
    expect(isUrgent(anUrgentOrder())).toBe(true);
    expect(calculateTotal(aHugeOrder())).toBeGreaterThan(MANAGER_CANCEL_LIMIT);
    expect(anOrderWithoutOwner().ownerId).toBeNull();
  });

  it('el DTO por defecto es un DTO que el backend podría enviar de verdad', () => {
    expect(parseOrderDto(aDto())).toEqual({ ok: true, value: aDto() });
  });

  it('el DTO recortado (lo que recibe un agente) también es válido, y llega sin responsable', () => {
    const parsed = parseOrderDto(aTrimmedDto());
    expect(parsed.ok).toBe(true);
    expect(parsed.ok && toOrder(parsed.value).ownerId).toBeNull();
  });
});
