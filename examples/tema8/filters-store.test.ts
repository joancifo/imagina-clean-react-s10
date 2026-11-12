// TEMA 8 · El mismo contrato para los dos adapters + los casos de error que solo tiene el real.
import { createMemoryFiltersStore, createWebStorageFiltersStore, type Filters, type FiltersStore } from './filters-store';

const filters: Filters = { text: 'brisa', status: 'pending', onlyMine: true };

const implementations: [string, () => FiltersStore][] = [
  ['localStorage', () => { localStorage.clear(); return createWebStorageFiltersStore(localStorage); }],
  ['sessionStorage', () => { sessionStorage.clear(); return createWebStorageFiltersStore(sessionStorage); }],
  ['memoria', () => createMemoryFiltersStore()],
];

describe.each(implementations)('contrato FiltersStore · %s', (_name, create) => {
  it('sin datos guardados devuelve null', () => {
    expect(create().load()).toBeNull();
  });
  it('devuelve lo último que se guardó', () => {
    const store = create();
    store.save(filters);
    store.save({ ...filters, text: 'norte' });
    expect(store.load()).toEqual({ ...filters, text: 'norte' });
  });
});

describe('adapter de errores (solo el real puede recibir basura)', () => {
  beforeEach(() => localStorage.clear());

  it('JSON corrupto → null, sin excepción', () => {
    localStorage.setItem('orders.filters', '{"text": "bri');
    expect(createWebStorageFiltersStore(localStorage).load()).toBeNull();
  });

  it('JSON válido con forma incorrecta → null (TypeScript no lo habría detectado)', () => {
    localStorage.setItem('orders.filters', JSON.stringify({ text: 42, status: 'deleted' }));
    expect(createWebStorageFiltersStore(localStorage).load()).toBeNull();
  });

  it('cuota llena al guardar → no rompe la pantalla', () => {
    const full = { getItem: () => null, setItem: () => { throw new DOMException('QuotaExceededError'); } } as unknown as Storage;
    expect(() => createWebStorageFiltersStore(full).save(filters)).not.toThrow();
  });
});
