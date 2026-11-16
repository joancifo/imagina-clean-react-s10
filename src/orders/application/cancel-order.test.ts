// @vitest-environment node
// Ejercicio S4 · Parte A · Especificación del caso de uso «Cancelar pedido».
// Todo con dobles de prueba escritos a mano: sin red, sin navegador, sin vi.mock.
import type { Actor } from '../domain/cancellation';
import type { Order, OrderStatus } from '../domain/order';
import { createCancelOrder } from './cancel-order';
import { OrderGatewayError, type CancelRequest, type Clock, type DomainEvent, type EventPublisher, type OrderGateway } from './ports';

const NOW = new Date('2026-11-16T18:00:00Z');
const admin: Actor = { id: 'u1', role: 'admin' };
const manager: Actor = { id: 'u2', role: 'manager' };
const REASON = '  Cliente   duplicado en el ERP ';

// Builder: pedido válido; cada test cambia solo lo que le importa.
const anOrder = (id: string, status: OrderStatus = 'pending', unitPrice = 1000): Order => ({
  id, customerName: 'Talleres Norte', customerTier: 'standard', status, ownerId: 'u2',
  createdAt: '2026-11-12T10:00:00Z', lines: [{ sku: 'A-10', quantity: 1, unitPrice }],
});

// FAKE del gateway: implementación de verdad, en memoria, que además registra las llamadas (spy).
function createFakeGateway(orders: Order[], failOn: Partial<Record<'findById' | 'cancel', Error>> = {}) {
  const calls: string[] = [];
  const cancelled: CancelRequest[] = [];
  const gateway: Pick<OrderGateway, 'findById' | 'cancel'> = {
    async findById(id) {
      calls.push(`findById:${id}`);
      if (failOn.findById) throw failOn.findById;
      return orders.find((o) => o.id === id) ?? null;
    },
    async cancel(request) {
      calls.push(`cancel:${request.orderId}`);
      if (failOn.cancel) throw failOn.cancel;
      cancelled.push(request);
    },
  };
  return { gateway, calls, cancelled };
}

// STUB del reloj: siempre la misma hora.
const fixedClock: Clock = { now: () => NOW };

// SPY del publicador: guarda lo que se publica y en qué momento.
function createEventSpy(calls: string[], fail = false) {
  const published: DomainEvent[] = [];
  const events: EventPublisher = {
    async publish(event) {
      calls.push(`publish:${event.type}`);
      if (fail) throw new Error('analítica caída');
      published.push(event);
    },
  };
  return { events, published };
}

function setup(orders: Order[] = [anOrder('P-1')], options: { failOn?: Partial<Record<'findById' | 'cancel', Error>>; publishFails?: boolean } = {}) {
  const fake = createFakeGateway(orders, options.failOn);
  const spy = createEventSpy(fake.calls, options.publishFails);
  const cancelOrder = createCancelOrder({ orders: fake.gateway, clock: fixedClock, events: spy.events });
  return { cancelOrder, ...fake, ...spy };
}

describe('cancelar pedido · camino feliz', () => {
  it('cancela, publica OrderCancelled con la hora del reloj y devuelve el pedido cancelado', async () => {
    const { cancelOrder, cancelled, published } = setup();
    const result = await cancelOrder({ orderId: 'P-1', reason: REASON, actor: admin });

    expect(result).toEqual({ ok: true, value: expect.objectContaining({ id: 'P-1', status: 'cancelled' }) });
    expect(cancelled).toEqual([{ orderId: 'P-1', reason: 'Cliente duplicado en el ERP', cancelledBy: 'u1' }]);
    expect(published).toEqual([
      { type: 'OrderCancelled', orderId: 'P-1', cancelledBy: 'u1', reason: 'Cliente duplicado en el ERP', occurredAt: '2026-11-16T18:00:00.000Z' },
    ]);
  });

  it('el orden de los efectos es: cargar → cancelar → publicar', async () => {
    const { cancelOrder, calls } = setup();
    await cancelOrder({ orderId: 'P-1', reason: REASON, actor: admin });
    expect(calls).toEqual(['findById:P-1', 'cancel:P-1', 'publish:OrderCancelled']);
  });
});

describe('cancelar pedido · errores previsibles (Result, sin excepciones)', () => {
  it('ENTRADA · un motivo no válido se rechaza antes de tocar la red', async () => {
    const { cancelOrder, calls } = setup();
    expect(await cancelOrder({ orderId: 'P-1', reason: 'a          b', actor: admin })).toEqual({ ok: false, error: 'too-short' });
    expect(calls).toEqual([]);
  });

  it('APLICACIÓN · un pedido que no existe es not-found y no se intenta cancelar', async () => {
    const { cancelOrder, calls } = setup([]);
    expect(await cancelOrder({ orderId: 'P-404', reason: REASON, actor: admin })).toEqual({ ok: false, error: 'not-found' });
    expect(calls).toEqual(['findById:P-404']);
  });

  it('DOMINIO · si la regla lo impide, devuelve su código y no hay efectos', async () => {
    const { cancelOrder, calls, published } = setup([anOrder('P-9', 'pending', 4200)]); // 5082 € con IVA
    expect(await cancelOrder({ orderId: 'P-9', reason: REASON, actor: manager })).toEqual({ ok: false, error: 'over-manager-limit' });
    expect(calls).toEqual(['findById:P-9']);
    expect(published).toEqual([]);
  });

  it('DOMINIO · la regla se aplica al estado ACTUAL del backend, no al que mostraba la pantalla', async () => {
    const { cancelOrder } = setup([anOrder('P-1', 'shipped')]);
    expect(await cancelOrder({ orderId: 'P-1', reason: REASON, actor: admin })).toEqual({ ok: false, error: 'already-closed' });
  });

  it('INFRAESTRUCTURA · un conflicto del backend se devuelve como conflict y no se publica nada', async () => {
    const { cancelOrder, published } = setup(undefined, { failOn: { cancel: new OrderGatewayError('conflict') } });
    expect(await cancelOrder({ orderId: 'P-1', reason: REASON, actor: admin })).toEqual({ ok: false, error: 'conflict' });
    expect(published).toEqual([]);
  });

  it('INFRAESTRUCTURA · sin backend al cargar, unavailable', async () => {
    const { cancelOrder } = setup(undefined, { failOn: { findById: new OrderGatewayError('unavailable') } });
    expect(await cancelOrder({ orderId: 'P-1', reason: REASON, actor: admin })).toEqual({ ok: false, error: 'unavailable' });
  });
});

describe('cancelar pedido · decisiones de diseño', () => {
  it('si la analítica falla, el pedido sigue cancelado: el resultado es ok', async () => {
    const { cancelOrder, cancelled } = setup(undefined, { publishFails: true });
    const result = await cancelOrder({ orderId: 'P-1', reason: REASON, actor: admin });
    expect(result.ok).toBe(true);
    expect(cancelled).toHaveLength(1);
  });

  it('un error que NO es previsible (un bug) no se disfraza de unavailable: se propaga', async () => {
    const { cancelOrder } = setup(undefined, { failOn: { cancel: new TypeError("Cannot read properties of undefined (reading 'id')") } });
    await expect(cancelOrder({ orderId: 'P-1', reason: REASON, actor: admin })).rejects.toThrow(TypeError);
  });
});
