// APLICACIÓN · Caso de uso «Abrir una devolución»: cargar el pedido y decidir si hoy se puede devolver.
import { err, ok, type Result } from '../domain/result';
import { returnWindowOf, type ReturnableOrder, type ReturnWindow } from '../domain/returnable-order';
import { ReturnsGatewayError, type Clock, type ReturnsFailure, type ReturnsGateway } from './ports';

export type ReturnableView = { order: ReturnableOrder; window: ReturnWindow };
export type LoadReturnableOrder = (orderId: string) => Promise<Result<ReturnableView, ReturnsFailure>>;

export function createLoadReturnableOrder({ returns, clock }: { returns: Pick<ReturnsGateway, 'loadReturnable'>; clock: Clock }): LoadReturnableOrder {
  return async (orderId) => {
    try {
      const order = await returns.loadReturnable(orderId);
      if (order === null) return err('not-found');
      return ok({ order, window: returnWindowOf(order, clock.now()) });
    } catch (error) {
      if (error instanceof ReturnsGatewayError) return err(error.failure);
      throw error;
    }
  };
}
