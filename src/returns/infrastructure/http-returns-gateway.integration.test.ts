// @vitest-environment node
// Sesión 10 · Paso 4 · El adapter HTTP contra el BFF DE VERDAD (server/bff.mjs), no contra un handler escrito a mano:
// si el BFF cambia el formato o un código de error, este test falla aquí y no en la pantalla.
import type { AddressInfo } from 'node:net';
import { createBff } from '../../../server/bff.mjs';
import { ReturnsGatewayError } from '../application/ports';
import { createHttpReturnsGateway } from './http-returns-gateway';

async function gatewayAs(userId: string, now = () => new Date('2026-11-30T17:00:00Z')) {
  const server = createBff({ secret: 'secreto-de-prueba', now }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const login = await fetch(`${baseUrl}/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];
  const withSession: typeof fetch = (input, init) => fetch(input, { ...init, headers: { ...((init?.headers as Record<string, string>) ?? {}), cookie } });
  return { gateway: createHttpReturnsGateway(withSession, baseUrl), close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
}

const failureOf = (promise: Promise<unknown>) => promise.then(() => 'sin error', (error: unknown) => (error instanceof ReturnsGatewayError ? error.failure : String(error)));

describe('HTTP ReturnsGateway contra el BFF', () => {
  it('traduce el contexto al lenguaje del dominio', async () => {
    const { gateway, close } = await gatewayAs('u2');
    try {
      expect(await gateway.loadReturnable('P-1004')).toEqual({
        orderId: 'P-1004', customerName: 'Clínica Dental Mar', tier: 'standard',
        lines: [{ sku: 'E-50', ordered: 3, unitPrice: 140, alreadyReturned: 1 }],
        delivery: { trackingNumber: 'TRK-88412', deliveredAt: '2026-11-12T10:00:00Z' },
      });
    } finally {
      await close();
    }
  });

  it('un pedido que no existe es null, no un error', async () => {
    const { gateway, close } = await gatewayAs('u2');
    try {
      expect(await gateway.loadReturnable('P-9999')).toBeNull();
    } finally {
      await close();
    }
  });

  it('registra y devuelve el importe que ha calculado el servidor', async () => {
    const { gateway, close } = await gatewayAs('u2');
    try {
      expect(await gateway.register({ orderId: 'P-1004', sku: 'E-50', quantity: 1, reason: 'NO_LONGER_NEEDED' })).toEqual({ returnId: 'RMA-002', refund: 148.4 });
      expect((await gateway.loadReturnable('P-1004'))?.lines[0].alreadyReturned).toBe(2);
    } finally {
      await close();
    }
  });

  it.each([
    ['un agente', 'u3', () => new Date('2026-11-30T17:00:00Z'), 1, 'forbidden'],
    ['más de lo que queda', 'u2', () => new Date('2026-11-30T17:00:00Z'), 3, 'quantity-exceeded'],
    ['fuera de plazo', 'u2', () => new Date('2026-12-12T10:01:00Z'), 1, 'not-returnable'],
  ] as const)('%s → %s', async (_caso, userId, now, quantity, expected) => {
    const { gateway, close } = await gatewayAs(userId, now);
    try {
      expect(await failureOf(gateway.register({ orderId: 'P-1004', sku: 'E-50', quantity, reason: 'DEFECTIVE' }))).toBe(expected);
    } finally {
      await close();
    }
  });

  it('sin red: unavailable', async () => {
    const gateway = createHttpReturnsGateway((() => Promise.reject(new TypeError('Failed to fetch'))) as typeof fetch);
    expect(await failureOf(gateway.loadReturnable('P-1004'))).toBe('unavailable');
  });
});
