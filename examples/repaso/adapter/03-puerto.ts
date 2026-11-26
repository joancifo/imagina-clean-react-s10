// Repaso · Adapters · NIVEL 3 · EN LA ARQUITECTURA: puerto, adapters y Composition Root.
// Ports & Adapters (A. Cockburn, «Hexagonal Architecture», 2005):
//   · PUERTO: la interfaz que NECESITA el caso de uso, escrita en su idioma. La define el que la usa.
//   · ADAPTERS: quienes la cumplen. Uno habla HTTP; otro guarda en memoria (tests, demos, desarrollo sin backend).
//   · El caso de uso depende del puerto, nunca de un adapter. Quién usa qué se decide en UN sitio: la composición.
import { toOrder, type Order } from './02-mapper';

// PUERTO · application/ports.ts en OrderDesk
export interface OrderReader {
  find(id: string): Promise<Order | null>;
}

// ADAPTER 1 · infrastructure/http-…
export function createHttpOrderReader(fetchFn: typeof fetch, baseUrl = '/api'): OrderReader {
  return {
    async find(id) {
      const response = await fetchFn(`${baseUrl}/orders/${encodeURIComponent(id)}`, { credentials: 'include' });
      if (response.status === 404) return null;
      return toOrder(await response.json());
    },
  };
}

// ADAPTER 2 · infrastructure/in-memory-…
export function createInMemoryOrderReader(orders: Order[]): OrderReader {
  return { find: async (id) => orders.find((order) => order.id === id) ?? null };
}

// CASO DE USO · application/… · Solo conoce el puerto. Se prueba sin red y se ejecuta con HTTP sin cambiar una línea.
export function createDescribeReturn({ orders }: { orders: OrderReader }) {
  return async (id: string): Promise<string> => {
    const order = await orders.find(id);
    if (!order) return 'No existe el pedido';
    return order.status === 'shipped' ? `Se puede devolver ${order.id}` : `${order.id} todavía no se ha enviado`;
  };
}

// COMPOSICIÓN · composition.ts / main.tsx · El ÚNICO sitio que elige adapter.
export const composeForProduction = (fetchFn: typeof fetch) => createDescribeReturn({ orders: createHttpOrderReader(fetchFn) });
export const composeForTests = (orders: Order[]) => createDescribeReturn({ orders: createInMemoryOrderReader(orders) });
