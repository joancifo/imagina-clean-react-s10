// TEMA 8 · Puerto de almacenamiento + dos adapters.
// Origen: src/pages/OrdersPage.tsx (Efectos 1 y 2) lee y escribe localStorage con JSON.parse sin protección:
// un valor corrupto en 'orders.filters' rompe la pantalla entera.
export type Filters = { text: string; status: 'all' | 'pending' | 'approved' | 'shipped' | 'cancelled'; onlyMine: boolean };

/** PUERTO: lo que la pantalla necesita, en su idioma. No dice «localStorage» ni «JSON». */
export interface FiltersStore {
  load(): Filters | null;
  save(filters: Filters): void;
}

const STATUSES: Filters['status'][] = ['all', 'pending', 'approved', 'shipped', 'cancelled'];

/** Valida en tiempo de ejecución: TypeScript no comprueba lo que viene de fuera. */
function parseFilters(raw: string | null): Filters | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as Partial<Filters>;
    const valid = typeof value.text === 'string' && STATUSES.includes(value.status as Filters['status']) && typeof value.onlyMine === 'boolean';
    return valid ? { text: value.text!, status: value.status!, onlyMine: value.onlyMine! } : null;
  } catch {
    return null; // JSON corrupto: se ignora en lugar de romper la pantalla
  }
}

/** ADAPTER real. Recibe el Storage por parámetro: sirve igual para localStorage o sessionStorage. */
export function createWebStorageFiltersStore(storage: Storage, key = 'orders.filters'): FiltersStore {
  return {
    load: () => parseFilters(storage.getItem(key)),
    save(filters) {
      try {
        storage.setItem(key, JSON.stringify(filters));
      } catch {
        // Cuota llena o modo privado: guardar filtros es una comodidad, no puede romper la pantalla.
      }
    },
  };
}

/** ADAPTER en memoria: tests, Storybook y SSR (donde no existe localStorage). */
export function createMemoryFiltersStore(initial: Filters | null = null): FiltersStore {
  let current = initial;
  return { load: () => current, save: (filters) => { current = { ...filters }; } };
}
