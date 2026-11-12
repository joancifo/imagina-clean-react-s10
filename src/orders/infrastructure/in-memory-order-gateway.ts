// INFRAESTRUCTURA · Fake de los puertos OrderGateway y OrderReader: una implementación DE VERDAD, en memoria.
// Sirve para tests, demos y desarrollo sin backend. Cumple el MISMO contrato que el adapter HTTP
// (lo comprueba order-gateway.contract.test.ts): si el fake miente, los tests que lo usan también.
// Lectura y escritura comparten el mismo almacén: lo que se cancela aparece cancelado al leer.
import { OrderGatewayError, type OrderGateway, type OrderReader } from '../application/ports';
import type { Order } from '../domain/order';

const CANCELLABLE: Order['status'][] = ['pending', 'approved'];

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
    async cancel({ orderId }) {
      const order = orders.get(orderId);
      if (!order) throw new OrderGatewayError('not-found');
      if (!CANCELLABLE.includes(order.status)) throw new OrderGatewayError('conflict');
      orders.set(orderId, { ...order, status: 'cancelled' });
    },
  };
}
