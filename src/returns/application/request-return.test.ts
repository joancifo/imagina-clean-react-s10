// @vitest-environment node
// Sesión 10 · Paso 4 · Casos de uso con el fake: sin red, sin navegador y con el reloj fijado.
import { at, CLASS_DAY, createInMemoryReturnsGateway, GOLD, P1004 } from '../testing';
import { createLoadReturnableOrder } from './load-returnable-order';
import { createRequestReturn } from './request-return';


describe('loadReturnableOrder', () => {
  it.each([
    ['2026-11-30T17:00:00Z', 'open'],
    ['2026-12-12T10:01:00Z', 'closed'],
  ])('el %s la ventana está %s', async (now, expected) => {
    const returns = createInMemoryReturnsGateway({ orders: [P1004], role: 'manager', clock: at(now) });
    const result = await createLoadReturnableOrder({ returns, clock: at(now) })('P-1004');
    expect(result.ok && result.value.window).toBe(expected);
  });

  it('sin entrega: not-delivered', async () => {
    const returns = createInMemoryReturnsGateway({ orders: [{ ...P1004, delivery: null }], role: 'manager', clock: CLASS_DAY });
    const result = await createLoadReturnableOrder({ returns, clock: CLASS_DAY })('P-1004');
    expect(result.ok && result.value.window).toBe('not-delivered');
  });

  it('un pedido que no existe: not-found', async () => {
    const returns = createInMemoryReturnsGateway({ orders: [], role: 'manager', clock: CLASS_DAY });
    expect(await createLoadReturnableOrder({ returns, clock: CLASS_DAY })('P-9')).toEqual({ ok: false, error: 'not-found' });
  });
});

describe('requestReturn', () => {
  it('registra y devuelve el importe confirmado', async () => {
    const returns = createInMemoryReturnsGateway({ orders: [P1004], role: 'manager', clock: CLASS_DAY });
    const result = await createRequestReturn({ returns })({ order: P1004, sku: 'E-50', quantity: 1, reason: 'NO_LONGER_NEEDED', role: 'manager' });
    expect(result).toEqual({ ok: true, value: { returnId: 'RMA-101', refund: 148.4 } });
    expect(returns.registered).toEqual([{ orderId: 'P-1004', sku: 'E-50', quantity: 1, reason: 'NO_LONGER_NEEDED' }]);
  });

  it.each([0, 3, 1.5])('cantidad %d: invalid-quantity, sin llamar al servidor', async (quantity) => {
    const returns = createInMemoryReturnsGateway({ orders: [P1004], role: 'manager', clock: CLASS_DAY });
    expect(await createRequestReturn({ returns })({ order: P1004, sku: 'E-50', quantity, reason: 'DEFECTIVE', role: 'manager' })).toEqual({ ok: false, error: 'invalid-quantity' });
    expect(returns.registered).toEqual([]);
  });

  it('un manager por encima de 500 €: needs-admin, sin llamar al servidor', async () => {
    const returns = createInMemoryReturnsGateway({ orders: [GOLD], role: 'manager', clock: CLASS_DAY });
    expect(await createRequestReturn({ returns })({ order: GOLD, sku: 'D-40', quantity: 5, reason: 'NO_LONGER_NEEDED', role: 'manager' })).toEqual({ ok: false, error: 'needs-admin' });
    expect(returns.registered).toEqual([]);
  });

  it('lo que solo sabe el servidor llega como error previsible (aquí, fuera de plazo)', async () => {
    const returns = createInMemoryReturnsGateway({ orders: [P1004], role: 'manager', clock: at('2026-12-12T10:01:00Z') });
    expect(await createRequestReturn({ returns })({ order: P1004, sku: 'E-50', quantity: 1, reason: 'DEFECTIVE', role: 'manager' })).toEqual({ ok: false, error: 'not-returnable' });
  });
});
