// Repaso · Adapters · NIVEL 4 (senior) · LA FRONTERA.
// Un adapter de producción hace tres cosas más que el del nivel 3:
//   1. PARSEA lo que llega (lista blanca), en vez de `as`. TypeScript no comprueba nada en ejecución.
//   2. Es un LECTOR TOLERANTE (M. Fowler, «TolerantReader», 2011): ignora campos nuevos y solo exige los que usa.
//      Así un cambio del backend que no te afecta no te rompe.
//   3. TRADUCE LOS ERRORES a fallos estables del puerto. Nadie fuera del adapter sabe qué es un 409 o un TypeError de red.
// Con un sistema heredado grande, este adapter crece hasta ser una CAPA ANTICORRUPCIÓN (E. Evans, «Domain-Driven Design», 2003):
// la frontera que impide que el modelo del otro sistema se filtre al tuyo.
import type { Order, OrderStatus } from './02-mapper';

export type ReaderFailure = 'not-found' | 'conflict' | 'unavailable' | 'invalid';
export class ReaderError extends Error {
  constructor(readonly failure: ReaderFailure) {
    super(failure);
  }
}

const STATUSES: ReadonlyArray<OrderStatus> = ['pending', 'approved', 'shipped', 'cancelled'];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** 1 y 2 · Lista blanca y lector tolerante. Acepta ord_st (v1) u order_status (v2): la migración del backend no nos para. */
export function parseOrder(raw: unknown): Order | null {
  if (!isRecord(raw) || typeof raw.ord_id !== 'string' || typeof raw.cust_nm !== 'string' || !Array.isArray(raw.ln_items)) return null;
  const status = raw.order_status ?? raw.ord_st;
  if (!STATUSES.includes(status as OrderStatus)) return null;
  const lines = raw.ln_items.map((line) => (isRecord(line) && typeof line.sku === 'string' && Number.isInteger(line.qty) && typeof line.unit_prc === 'number' ? { sku: line.sku, quantity: line.qty as number, unitPrice: line.unit_prc } : null));
  if (lines.some((line) => line === null)) return null;
  return { id: raw.ord_id, customerName: raw.cust_nm, tier: typeof raw.cust_tier === 'string' ? raw.cust_tier : 'standard', status: status as OrderStatus, lines: lines as Order['lines'] };
}

/** 3 · Errores traducidos. Manda el código del cuerpo; el estado HTTP es el plan B; lo desconocido es «no disponible». */
async function failureOf(response: Response): Promise<ReaderFailure> {
  const body = await response.json().catch(() => null);
  const code = isRecord(body) && isRecord(body.error) ? body.error.code : undefined;
  if (code === 'conflict' || response.status === 409) return 'conflict';
  if (code === 'not-found' || response.status === 404) return 'not-found';
  return 'unavailable';
}

export function createProductionOrderReader(fetchFn: typeof fetch, baseUrl = '/api') {
  return {
    async find(id: string): Promise<Order | null> {
      let response: Response;
      try {
        response = await fetchFn(`${baseUrl}/orders/${encodeURIComponent(id)}`, { credentials: 'include' });
      } catch {
        throw new ReaderError('unavailable'); // red caída, CORS, DNS…: para el caso de uso, todo es lo mismo
      }
      if (response.status === 404) return null;
      if (!response.ok) throw new ReaderError(await failureOf(response));
      const order = parseOrder(await response.json().catch(() => null));
      if (!order) throw new ReaderError('invalid');
      return order;
    },
  };
}

// CUÁNDO NO: un puerto se paga (contrato + adapter + fake + parser). No lo pongas delante de lo que nunca se sustituye
// ni cruza una frontera: Intl.NumberFormat, una función pura de utilidades, el router de React. Guía de decisión, sección 2.
