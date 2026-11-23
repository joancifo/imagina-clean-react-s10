// PRUEBAS · Dobles de prueba escritos a mano. Ni un `vi.mock` en todo el archivo.
// Los cinco tipos (Meszaros, «xUnit Test Patterns», 2007):
//   dummy  se pasa para rellenar y no se usa          · un actor que nadie mira
//   stub   devuelve respuestas preparadas             · aFailingGateway
//   spy    además, apunta lo que le han pedido        · aRecordingSink
//   mock   falla él mismo si no se le llama como toca · aStrictPublisher
//   fake   implementación de verdad, más simple       · createInMemoryOrderGateway (infrastructure/)
//
// El fake del gateway y el del publicador ya existen en infrastructure/: NO se duplican aquí.
// Aquí solo viven los dobles que hacen falta para probar CAMINOS DE ERROR, que un fake no reproduce.
import { OrderGatewayError, type Clock, type DomainEvent, type EventPublisher, type GatewayFailure, type OrderGateway } from '../application/ports';
import type { LogEntry, LogSink } from '../../observability';

/** STUB · El reloj es un puerto: en los tests, una fecha fija. Sin fecha fija no hay test determinista. */
export const aFixedClock = (iso = '2026-11-25T18:00:00.000Z'): Clock => ({ now: () => new Date(iso) });

/** STUB · Identificadores predecibles: t-1, t-2, t-3… Un UUID real haría el test imposible de comprobar. */
export function anIdSequence(prefix = 't'): () => string {
  let issued = 0;
  return () => `${prefix}-${++issued}`;
}

/** STUB · Un gateway que SIEMPRE falla del mismo modo. Para probar cada rama de error del caso de uso. */
export function aFailingGateway(failure: GatewayFailure): OrderGateway {
  const fail = async (): Promise<never> => {
    throw new OrderGatewayError(failure);
  };
  return { findById: fail, cancel: fail, approve: fail };
}

/** STUB · Falla la primera vez y funciona la segunda: así se prueba un reintento sin esperar de verdad. */
export function aGatewayThatFailsOnce(gateway: OrderGateway, failure: GatewayFailure = 'unavailable'): OrderGateway {
  let failed = false;
  return {
    ...gateway,
    async findById(id) {
      if (failed) return gateway.findById(id);
      failed = true;
      throw new OrderGatewayError(failure);
    },
  };
}

/** SPY · Apunta los lotes que recibe. `sent.flat()` da todas las entradas en orden. */
export function aRecordingSink(): LogSink & { sent: LogEntry[][] } {
  const sent: LogEntry[][] = [];
  return {
    sent,
    async send(batch) {
      sent.push(batch);
    },
  };
}

/** SPY · Publicador que apunta y no falla nunca. Para comprobar QUÉ se publicó, no CÓMO. */
export function aRecordingPublisher(): EventPublisher & { published: DomainEvent[] } {
  const published: DomainEvent[] = [];
  return {
    published,
    async publish(event) {
      published.push(event);
    },
  };
}

/** MOCK · Falla él mismo si lo llaman cuando no debían. Úsalo poco: un mock que vigila demasiado
 *  acaba comprobando la implementación en vez del comportamiento. */
export function aPublisherThatMustNotBeCalled(): EventPublisher {
  return {
    async publish(event) {
      throw new Error(`No se esperaba publicar ningún evento, y ha llegado ${event.type}`);
    },
  };
}

/** DUMMY · Se pasa para rellenar un parámetro obligatorio que este test no mira. */
export const aDummyClock: Clock = { now: () => new Date(0) };
