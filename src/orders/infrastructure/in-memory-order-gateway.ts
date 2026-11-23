// INFRAESTRUCTURA · Fake de los puertos OrderGateway y OrderReader: una implementación DE VERDAD, en memoria.
// Sirve para tests, demos y desarrollo sin backend. Cumple el MISMO contrato que el adapter HTTP
// (lo comprueba order-gateway.contract.test.ts): si el fake miente, los tests que lo usan también.
// Lectura y escritura comparten el mismo almacén: lo que se cancela aparece cancelado al leer.
import { OrderGatewayError, type OrderGateway, type OrderReader } from '../application/ports';
import { REASON_MAX_LENGTH } from '../domain/cancellation-reason';
import type { Order } from '../domain/order';

const CANCELLABLE: Order['status'][] = ['pending', 'approved'];

/** Sesión 8 · El backend rechaza con 422 lo que no cabe en el campo. Un fake que lo acepta MIENTE,
 *  y los veinte tests que lo usan mienten con él. La longitud sale de shared/policy.json: mismo dato
 *  que lee el BFF, para que los dos no se separen. */
const MIN_REASON_LENGTH = 3;

export function createInMemoryOrderGateway(seed: Order[] = []): OrderGateway & OrderReader {
  const orders = new Map(seed.map((order) => [order.id, structuredClone(order)]));
  return {
    async findAll() {
      return structuredClone([...orders.values()]);
    },
    async findById(id) {
      const order = orders.get(id);
      return order ? structuredClone(order) : null;
    },
    async cancel({ orderId, reason }) {
      const text = String(reason);
      if (text.trim().length < MIN_REASON_LENGTH || text.length > REASON_MAX_LENGTH) throw new OrderGatewayError('invalid');
      const order = orders.get(orderId);
      if (!order) throw new OrderGatewayError('not-found');
      if (!CANCELLABLE.includes(order.status)) throw new OrderGatewayError('conflict');
      orders.set(orderId, { ...order, status: 'cancelled' });
    },
    async approve({ orderId }) {
      const order = orders.get(orderId);
      if (!order) throw new OrderGatewayError('not-found');
      if (order.status !== 'pending') throw new OrderGatewayError('conflict');
      orders.set(orderId, { ...order, status: 'approved' });
    },
  };
}
