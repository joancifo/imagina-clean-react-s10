// COMPOSICIÓN · Devoluciones: único lugar donde se eligen implementaciones y se conectan con los casos de uso.
// Inyección manual, como Pedidos (ADR-002). Lo crea main.tsx (producción) o el test.
import { createLoadReturnableOrder, type LoadReturnableOrder } from './application/load-returnable-order';
import type { Clock, ReturnsGateway } from './application/ports';
import { createRequestReturn, type RequestReturn } from './application/request-return';
import { createHttpReturnsGateway } from './infrastructure/http-returns-gateway';

export type ReturnsAdapters = { returns: ReturnsGateway; clock: Clock };
export type ReturnsModule = { loadReturnableOrder: LoadReturnableOrder; requestReturn: RequestReturn };

export function createReturnsModule({ returns, clock }: ReturnsAdapters): ReturnsModule {
  return { loadReturnableOrder: createLoadReturnableOrder({ returns, clock }), requestReturn: createRequestReturn({ returns }) };
}

export function createHttpReturnsAdapters(fetchFn: typeof fetch, baseUrl = '/api'): ReturnsAdapters {
  return { returns: createHttpReturnsGateway(fetchFn, baseUrl), clock: { now: () => new Date() } };
}
