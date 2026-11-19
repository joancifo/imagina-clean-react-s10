// APLICACIÓN · Caso de uso «Ver el detalle de un pedido» (Sesión 7).
// Aporta algo más que reenviar: convierte «no existe» y «no hay servidor» en resultados previsibles,
// para que la pantalla trate cuatro estados (cargando, no existe, error, listo) sin capturar excepciones.
import type { Order } from '../domain/order';
import { err, ok, type Result } from '../domain/result';
import { OrderGatewayError, type OrderGateway } from './ports';

export type LoadOrderDetailCommand = { orderId: string };
export type LoadOrderDetailError = 'not-found' | 'unavailable';
export type LoadOrderDetail = (command: LoadOrderDetailCommand) => Promise<Result<Order, LoadOrderDetailError>>;

export function createLoadOrderDetail({ orders }: { orders: Pick<OrderGateway, 'findById'> }): LoadOrderDetail {
  return async ({ orderId }) => {
    try {
      const order = await orders.findById(orderId);
      return order === null ? err('not-found') : ok(order);
    } catch (error) {
      if (error instanceof OrderGatewayError) return err(error.failure === 'not-found' ? 'not-found' : 'unavailable');
      throw error;
    }
  };
}
