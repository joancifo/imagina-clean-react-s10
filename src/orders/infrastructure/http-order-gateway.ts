// INFRAESTRUCTURA · Adapter conducido (de salida): implementa el puerto OrderGateway con fetch.
// Es el ÚNICO archivo que sabe que hay HTTP, rutas, cabeceras, códigos de estado y DTO del backend.
import { OrderGatewayError, type OrderGateway } from '../application/ports';
import type { OrderDto } from './order-dto';
import { toOrder } from './order-mapper';

/** fetch solo rechaza si NO hay respuesta (red caída, DNS, CORS): lanza TypeError. Un 404 o un 500 se resuelven. */
async function send(fetchFn: typeof fetch, url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetchFn(url, init);
  } catch {
    throw new OrderGatewayError('unavailable', `Sin respuesta del servidor (${url})`);
  }
}

/** Adapter de errores: convierte códigos HTTP en fallos estables del puerto. */
function failureFor(response: Response): OrderGatewayError {
  if (response.status === 404) return new OrderGatewayError('not-found', `HTTP 404 · ${response.url}`);
  if (response.status === 409) return new OrderGatewayError('conflict', `HTTP 409 · ${response.url}`);
  return new OrderGatewayError('unavailable', `HTTP ${response.status} · ${response.url}`);
}

export function createHttpOrderGateway(fetchFn: typeof fetch = fetch, baseUrl = '/api'): OrderGateway {
  return {
    async findById(id) {
      const response = await send(fetchFn, `${baseUrl}/orders/${encodeURIComponent(id)}`);
      if (response.status === 404) return null;
      if (!response.ok) throw failureFor(response);
      const dto: OrderDto = await response.json();
      return toOrder(dto);
    },

    async cancel({ orderId, reason, cancelledBy }) {
      const response = await send(fetchFn, `${baseUrl}/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-id': cancelledBy },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw failureFor(response);
    },
  };
}
