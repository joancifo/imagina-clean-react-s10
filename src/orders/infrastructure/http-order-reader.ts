// INFRAESTRUCTURA · Adapter conducido (de salida): implementa el puerto OrderReader con fetch.
import { OrderReadError, type OrderReader } from '../application/ports';
import { describeProblem } from './order-dto';
import { parseOrders } from './order-mapper';

export function createHttpOrderReader(fetchFn: typeof fetch = fetch, baseUrl = '/api'): OrderReader {
  return {
    async findAll() {
      const response = await fetchFn(`${baseUrl}/orders`);
      if (!response.ok) throw new OrderReadError(`No se pudieron leer los pedidos (HTTP ${response.status})`);
      // Sesión 8 · Si una sola fila no es utilizable, no se enseña media lista con datos inventados.
      const orders = parseOrders(await response.json().catch(() => null));
      if (!orders.ok) throw new OrderReadError(describeProblem(orders.error));
      return orders.value;
    },
  };
}
