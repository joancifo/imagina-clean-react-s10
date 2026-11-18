// PRESENTACIÓN · Criterios de la lista (búsqueda, estado, «solo míos», orden) y su traducción a la URL.
// La URL es la FUENTE DE VERDAD de este estado: se puede compartir, recargar y navegar con atrás/adelante.
// Módulo puro: no importa React ni el router. El hook useOrdersCriteria lo conecta con useSearchParams.
import type { OrderStatus } from '../domain/order';

export type SortKey = 'date' | 'total' | 'customer';
export type OrdersCriteria = { text: string; status: OrderStatus | 'all'; onlyMine: boolean; sort: SortKey };

export const DEFAULT_CRITERIA: OrdersCriteria = { text: '', status: 'all', onlyMine: false, sort: 'date' };

const STATUSES: OrdersCriteria['status'][] = ['all', 'pending', 'approved', 'shipped', 'cancelled'];
const SORTS: SortKey[] = ['date', 'total', 'customer'];

// Parámetros de la URL: ?q=hotel&status=pending&mine=1&sort=total
const oneOf = <T extends string>(value: string | null, allowed: T[], fallback: T): T =>
  (allowed as string[]).includes(value ?? '') ? (value as T) : fallback;

/** La URL la puede escribir cualquiera: un valor desconocido NO rompe la pantalla, vuelve al valor por defecto. */
export function parseCriteria(params: URLSearchParams): OrdersCriteria {
  return {
    text: params.get('q') ?? '',
    status: oneOf(params.get('status'), STATUSES, DEFAULT_CRITERIA.status),
    onlyMine: params.get('mine') === '1',
    sort: oneOf(params.get('sort'), SORTS, DEFAULT_CRITERIA.sort),
  };
}

/** Escribe los criterios sobre `base` sin tocar los parámetros ajenos. Los valores por defecto no se escriben. */
export function writeCriteria(criteria: OrdersCriteria, base: URLSearchParams = new URLSearchParams()): URLSearchParams {
  const params = new URLSearchParams(base);
  const set = (key: string, value: string, isDefault: boolean) => (isDefault ? params.delete(key) : params.set(key, value));
  set('q', criteria.text, criteria.text === DEFAULT_CRITERIA.text);
  set('status', criteria.status, criteria.status === DEFAULT_CRITERIA.status);
  set('mine', '1', !criteria.onlyMine);
  set('sort', criteria.sort, criteria.sort === DEFAULT_CRITERIA.sort);
  return params;
}
