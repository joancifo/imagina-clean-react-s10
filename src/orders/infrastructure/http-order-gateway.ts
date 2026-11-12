// INFRAESTRUCTURA · Adapter conducido (de salida): implementa el puerto OrderGateway con fetch.
// Es el ÚNICO archivo que sabe que hay HTTP, rutas, cabeceras, códigos de estado y DTO del backend.
import { OrderGatewayError, type OrderGateway } from '../application/ports';
import { toOrder } from './order-mapper';

// Ejercicio S4 · Parte B. Especificación: order-gateway.contract.ts y http-order-gateway.test.ts
//   findById → GET  {baseUrl}/orders/:id         · 404 → null · el JSON es un OrderDto ('./order-dto') → toOrder
//   cancel   → POST {baseUrl}/orders/:id/cancel  · content-type JSON · x-user-id · body { reason }
//   404 → 'not-found' · 409 → 'conflict' · otra respuesta no-ok → 'unavailable' · fetch rechazado → 'unavailable'
// Recuerda: fetch NO rechaza con 404 ni 500; solo cuando no hay respuesta.
export function createHttpOrderGateway(fetchFn: typeof fetch = fetch, baseUrl = '/api'): OrderGateway {
  void [fetchFn, baseUrl, OrderGatewayError, toOrder];
  return {
    async findById(id) {
      void id;
      throw new Error('Por implementar (ejercicio S4 · Parte B · findById)');
    },
    async cancel(request) {
      void request;
      throw new Error('Por implementar (ejercicio S4 · Parte B · cancel)');
    },
  };
}
