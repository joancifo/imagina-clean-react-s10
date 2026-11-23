// TEST DE CONTRATO del puerto OrderGateway: lo que TODA implementación debe cumplir.
// Se ejecuta contra el fake en memoria y contra el adapter HTTP con el backend de verdad.
// Si los dos pasan, el fake es un sustituto fiel (Liskov) y los tests que lo usan dicen la verdad.
import { OrderGatewayError, type GatewayFailure, type OrderGateway } from '../application/ports';
import { REASON_MAX_LENGTH, createCancellationReason, type CancellationReason } from '../domain/cancellation-reason';

/** Datos que debe tener cada implementación al empezar: los de server/store.mjs (SEED_ORDERS). */
export type GatewayFactory = () => Promise<{ gateway: OrderGateway; dispose?: () => Promise<void> }>;

const reason = createCancellationReason('Cliente duplicado en el ERP');
if (!reason.ok) throw new Error('motivo de prueba no válido');
const REASON: CancellationReason = reason.value;

async function failureOf(promise: Promise<unknown>): Promise<GatewayFailure | 'no-error' | 'other-error'> {
  try {
    await promise;
    return 'no-error';
  } catch (error) {
    return error instanceof OrderGatewayError ? error.failure : 'other-error';
  }
}

export function describeOrderGatewayContract(name: string, factory: GatewayFactory, options: { skip?: boolean } = {}) {
  (options.skip ? describe.skip : describe)(`contrato OrderGateway · ${name}`, () => {
    let gateway: OrderGateway;
    let dispose: (() => Promise<void>) | undefined;

    beforeEach(async () => {
      ({ gateway, dispose } = await factory());
    });
    afterEach(async () => {
      await dispose?.();
    });

    it('findById devuelve el pedido en el modelo de DOMINIO (sin nombres del backend)', async () => {
      expect(await gateway.findById('P-1005')).toEqual({
        id: 'P-1005', customerName: 'Hotel Brisa', customerTier: 'silver', status: 'pending', ownerId: 'u2',
        createdAt: '2026-10-08T10:00:00Z', lines: [{ sku: 'A-10', quantity: 10, unitPrice: 32.5 }],
      });
    });

    it('findById de un pedido que no existe devuelve null (no lanza)', async () => {
      expect(await gateway.findById('P-9999')).toBeNull();
    });

    it('cancel de un pendiente: después el pedido está cancelado', async () => {
      await gateway.cancel({ orderId: 'P-1005', reason: REASON, cancelledBy: 'u2' });
      expect((await gateway.findById('P-1005'))?.status).toBe('cancelled');
    });

    it('cancel de un aprobado también se acepta', async () => {
      await gateway.cancel({ orderId: 'P-1002', reason: REASON, cancelledBy: 'u1' });
      expect((await gateway.findById('P-1002'))?.status).toBe('cancelled');
    });

    it('cancel de un enviado es conflict y el pedido no cambia', async () => {
      expect(await failureOf(gateway.cancel({ orderId: 'P-1004', reason: REASON, cancelledBy: 'u1' }))).toBe('conflict');
      expect((await gateway.findById('P-1004'))?.status).toBe('shipped');
    });

    it('cancelar dos veces: la segunda es conflict', async () => {
      await gateway.cancel({ orderId: 'P-1001', reason: REASON, cancelledBy: 'u1' });
      expect(await failureOf(gateway.cancel({ orderId: 'P-1001', reason: REASON, cancelledBy: 'u1' }))).toBe('conflict');
    });

    // Sesión 5 · approve
    it('approve de un pendiente: después el pedido está aprobado', async () => {
      await gateway.approve({ orderId: 'P-1005', approvedBy: 'u2' });
      expect((await gateway.findById('P-1005'))?.status).toBe('approved');
    });

    it('approve de un pedido que no está pendiente es conflict', async () => {
      expect(await failureOf(gateway.approve({ orderId: 'P-1002', approvedBy: 'u1' }))).toBe('conflict');
    });

    it('approve de un pedido que no existe es not-found', async () => {
      expect(await failureOf(gateway.approve({ orderId: 'P-9999', approvedBy: 'u1' }))).toBe('not-found');
    });

    it('cancel de un pedido que no existe es not-found', async () => {
      expect(await failureOf(gateway.cancel({ orderId: 'P-9999', reason: REASON, cancelledBy: 'u1' }))).toBe('not-found');
    });

    // ── Sesión 8 · Lo que el backend VALIDA ────────────────────────────────────────
    // Un contrato no es solo «qué devuelve cuando todo va bien»: también es «qué rechaza».
    // Estos tres casos son los que el fake en memoria no sabía, y por eso veinte tests que lo usaban
    // estaban demostrando un comportamiento que en producción no existe.
    describe.skip('lo que valida el backend', () => {
      it(`un motivo más largo de ${REASON_MAX_LENGTH} caracteres es invalid, y el pedido no cambia`, async () => {
        // El cast es deliberado: el puerto recibe lo que le den. El contrato dice qué pasa ENTONCES,
        // no qué pasa cuando quien llama se porta bien. (El dominio ya no deja construir uno así.)
        const tooLong = 'x'.repeat(REASON_MAX_LENGTH + 60) as CancellationReason;
        expect(await failureOf(gateway.cancel({ orderId: 'P-1005', reason: tooLong, cancelledBy: 'u1' }))).toBe('invalid');
        expect((await gateway.findById('P-1005'))?.status).toBe('pending');
      });

      it('un motivo de la longitud máxima exacta sí se acepta', async () => {
        const exact = 'x'.repeat(REASON_MAX_LENGTH) as CancellationReason;
        await gateway.cancel({ orderId: 'P-1005', reason: exact, cancelledBy: 'u1' });
        expect((await gateway.findById('P-1005'))?.status).toBe('cancelled');
      });

      it('cancelar cambia el estado y NADA más', async () => {
        const before = await gateway.findById('P-1005');
        await gateway.cancel({ orderId: 'P-1005', reason: REASON, cancelledBy: 'u1' });
        expect(await gateway.findById('P-1005')).toEqual({ ...before, status: 'cancelled' });
      });
    });
  });
}
