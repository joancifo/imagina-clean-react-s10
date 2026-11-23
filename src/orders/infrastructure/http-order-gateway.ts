// INFRAESTRUCTURA · Adapter conducido (de salida): implementa el puerto OrderGateway con fetch.
// Es el ÚNICO archivo que sabe que hay HTTP, rutas, cabeceras, códigos de estado y DTO del backend.
import { OrderGatewayError, type OrderGateway } from '../application/ports';
import { failureFor, readBody } from './gateway-failure';
import { describeProblem } from './order-dto';
import { parseOrder } from './order-mapper';

/** fetch solo rechaza si NO hay respuesta (red caída, DNS, CORS): lanza TypeError. Un 404 o un 500 se resuelven. */
async function send(fetchFn: typeof fetch, url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetchFn(url, init);
  } catch {
    throw new OrderGatewayError('unavailable', `Sin respuesta del servidor (${url})`);
  }
}

/** Adapter de errores: código del BFF primero, estado HTTP después (gateway-failure.ts). */
async function errorFor(response: Response): Promise<OrderGatewayError> {
  const failure = failureFor(response.status, await readBody(response));
  return new OrderGatewayError(failure, `HTTP ${response.status} · ${failure}`);
}

export function createHttpOrderGateway(fetchFn: typeof fetch = fetch, baseUrl = '/api'): OrderGateway {
  return {
    async findById(id) {
      const response = await send(fetchFn, `${baseUrl}/orders/${encodeURIComponent(id)}`, { credentials: 'include' });
      if (response.status === 404) return null;
      if (!response.ok) throw await errorFor(response);
      // Sesión 8 · La frontera valida. Un backend que cambia sin avisar se nota AQUÍ, no en la pantalla.
      const order = parseOrder(await readBody(response));
      if (!order.ok) throw new OrderGatewayError('invalid', describeProblem(order.error));
      return order.value;
    },

    // Sesión 6 · La identidad ya NO viaja en el cuerpo ni en una cabecera elegida por el cliente:
    // va en la cookie de sesión (HttpOnly) que pone el BFF. Por eso credentials: 'include'.
    async cancel({ orderId, reason }) {
      const response = await send(fetchFn, `${baseUrl}/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw await errorFor(response);
    },
    async approve({ orderId }) {
      const response = await send(fetchFn, `${baseUrl}/orders/${encodeURIComponent(orderId)}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw await errorFor(response);
    },
  };
}
