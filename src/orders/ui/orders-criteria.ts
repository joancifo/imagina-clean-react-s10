// PRESENTACIÓN · Criterios de la lista (búsqueda, estado, «solo míos», orden) y su traducción a la URL.
// La URL es la FUENTE DE VERDAD de este estado: se puede compartir, recargar y navegar con atrás/adelante.
// Módulo puro: no importa React ni el router. El hook useOrdersCriteria lo conecta con useSearchParams.
import type { OrderStatus } from '../domain/order';

export type SortKey = 'date' | 'total' | 'customer';
export type OrdersCriteria = { text: string; status: OrderStatus | 'all'; onlyMine: boolean; sort: SortKey };

export const DEFAULT_CRITERIA: OrdersCriteria = { text: '', status: 'all', onlyMine: false, sort: 'date' };

// Parámetros de la URL: ?q=hotel&status=pending&mine=1&sort=total

// Ejercicio S5 · Parte B. La especificación es orders-criteria.test.ts.
export function parseCriteria(params: URLSearchParams): OrdersCriteria {
  void params;
  throw new Error('Por implementar (ejercicio S5 · Parte B)');
}

/** Escribe los criterios sobre `base` sin tocar los parámetros ajenos. Los valores por defecto no se escriben. */
export function writeCriteria(criteria: OrdersCriteria, base: URLSearchParams = new URLSearchParams()): URLSearchParams {
  void [criteria, base];
  throw new Error('Por implementar (ejercicio S5 · Parte B)');
}
