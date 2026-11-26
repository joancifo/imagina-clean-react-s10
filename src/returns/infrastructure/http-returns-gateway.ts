// INFRAESTRUCTURA · Adapter HTTP del puerto ReturnsGateway, contra el BFF (paso 4 del plan).
// Sabe de rutas, credenciales, códigos de estado y del formato del BFF. El resto de la feature, no.
import { ReturnsGatewayError, type ReturnsFailure, type ReturnsGateway } from '../application/ports';
import { parseReturnContext } from './return-context-dto';

/** Códigos del BFF (server/returns.mjs) → fallo del puerto. Manda el código; el estado HTTP es el plan B. */
const BY_CODE: Record<string, ReturnsFailure> = {
  'no-session': 'forbidden',
  forbidden: 'forbidden',
  'needs-admin': 'needs-admin',
  'not-returnable': 'not-returnable',
  'quantity-exceeded': 'quantity-exceeded',
  'invalid-body': 'invalid',
  'not-found': 'not-found',
};
const BY_STATUS: Record<number, ReturnsFailure> = { 401: 'forbidden', 403: 'forbidden', 404: 'not-found', 409: 'not-returnable', 422: 'invalid' };

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

async function errorFor(response: Response): Promise<ReturnsGatewayError> {
  const body = await readBody(response);
  const code = typeof body === 'object' && body !== null ? (body as { error?: { code?: unknown } }).error?.code : undefined;
  const failure = (typeof code === 'string' && BY_CODE[code]) || BY_STATUS[response.status] || 'unavailable';
  return new ReturnsGatewayError(failure, `HTTP ${response.status} · ${failure}`);
}

async function send(fetchFn: typeof fetch, url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetchFn(url, { ...init, credentials: 'include' });
  } catch {
    throw new ReturnsGatewayError('unavailable', `Sin respuesta del servidor (${url})`);
  }
}

export function createHttpReturnsGateway(fetchFn: typeof fetch, baseUrl = '/api'): ReturnsGateway {
  const orderUrl = (id: string) => `${baseUrl}/orders/${encodeURIComponent(id)}`;
  return {
    async loadReturnable(orderId) {
      const response = await send(fetchFn, `${orderUrl(orderId)}/return-context`, {});
      if (response.status === 404) return null;
      if (!response.ok) throw await errorFor(response);
      const order = parseReturnContext(await readBody(response));
      if (!order.ok) throw new ReturnsGatewayError('invalid', `Respuesta inesperada del BFF: ${order.error}`);
      return order.value;
    },
    async register({ orderId, sku, quantity, reason }) {
      // Qué y por qué. Ni importe, ni rol, ni quién: eso lo pone el servidor.
      const response = await send(fetchFn, `${orderUrl(orderId)}/returns`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sku, qty: quantity, reason }),
      });
      if (!response.ok) throw await errorFor(response);
      const body = await readBody(response);
      const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
      if (typeof record.rma_id !== 'string' || typeof record.rfd_amt !== 'number') throw new ReturnsGatewayError('invalid', 'Confirmación sin rma_id o rfd_amt');
      return { returnId: record.rma_id, refund: record.rfd_amt };
    },
  };
}
