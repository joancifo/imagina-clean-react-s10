// @vitest-environment node
// Ejercicio S4 · Parte B · Lo que el contrato no puede provocar con el backend real: red caída, 500, formato de la petición.
import { OrderGatewayError } from '../application/ports';
import type { CancellationReason } from '../domain/cancellation-reason';
import { createHttpOrderGateway } from './http-order-gateway';

const REASON = 'Cliente duplicado en el ERP' as CancellationReason; // cast permitido solo en tests de infraestructura
const respond = (status: number, body: unknown = {}) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

async function failureOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 'no-error';
  } catch (error) {
    return error instanceof OrderGatewayError ? error.failure : `otro error: ${String(error)}`;
  }
}

// Parte B · paso 1: quita .skip
describe.skip('adapter HTTP · casos que el contrato no cubre', () => {
  it('red caída (fetch rechaza con TypeError) → unavailable, en las dos operaciones', async () => {
    const offline = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    const gateway = createHttpOrderGateway(offline);
    expect(await failureOf(gateway.findById('P-1'))).toBe('unavailable');
    expect(await failureOf(gateway.cancel({ orderId: 'P-1', reason: REASON, cancelledBy: 'u1' }))).toBe('unavailable');
  });

  it('HTTP 500 o 503 → unavailable (fetch NO rechaza: hay que mirar response.ok)', async () => {
    expect(await failureOf(createHttpOrderGateway(respond(500)).findById('P-1'))).toBe('unavailable');
    expect(await failureOf(createHttpOrderGateway(respond(503)).cancel({ orderId: 'P-1', reason: REASON, cancelledBy: 'u1' }))).toBe('unavailable');
  });

  it('envía POST /orders/:id/cancel con el motivo en JSON y el actor en x-user-id', async () => {
    const fetchFn = respond(200);
    await createHttpOrderGateway(fetchFn, '/api').cancel({ orderId: 'P-1005', reason: REASON, cancelledBy: 'u2' });
    const [url, init] = vi.mocked(fetchFn).mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/orders/P-1005/cancel');
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('x-user-id')).toBe('u2');
    expect(JSON.parse(String(init.body))).toEqual({ reason: 'Cliente duplicado en el ERP' });
  });
});
