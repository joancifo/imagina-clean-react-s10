// @vitest-environment node
// TEMA 19 · Fixtures compartidas que no se pudren.
//
// Una fixture copiada en cada archivo envejece en silencio: el backend cambia, los tests siguen verdes
// y lo que demuestran ya no existe. Una fixture que SALE de la fuente real envejece a la vista:
// un solo test falla y dice dónde.
import { SEED_DTOS, aDto } from '../../src/orders/testing';

/** Comprobación mínima e independiente: aquí no se prueba el parser de la aplicación, se prueba la fixture. */
const tieneFormaDePedido = (dto: Record<string, unknown>) =>
  typeof dto.ord_id === 'string' && typeof dto.cust_nm === 'string' && Array.isArray(dto.ln_items);

describe('la fixture sale de una sola fuente', () => {
  it('los datos que usan los tests son LOS DEL backend, no una copia', () => {
    // SEED_DTOS se importa de server/store.mjs: lo que sirven de verdad la API heredada y el BFF.
    expect(SEED_DTOS.length).toBeGreaterThanOrEqual(6);
    for (const dto of SEED_DTOS) expect(tieneFormaDePedido(dto as unknown as Record<string, unknown>)).toBe(true);
  });

  it('el builder produce datos con los MISMOS campos que el backend, no con unos parecidos', () => {
    // Si el backend añade un campo y el builder no, este test lo dice el mismo día.
    expect(Object.keys(aDto()).sort()).toEqual(Object.keys(SEED_DTOS[0]).sort());
  });
});

describe('una fixture copiada a mano: cómo se pudre', () => {
  // Esto es lo que había en cuatro archivos distintos de este repositorio antes de la Sesión 8.
  const COPIA_DE_HACE_SEIS_MESES = { ord_id: 'P-1', cust_nm: 'Cliente', cust_tier: 'standard', ord_st: 'pending', owner_id: 'u2', crt_ts: '2026-01-01T00:00:00Z', ln_items: [] };

  it('sigue teniendo forma de pedido, así que nadie se entera de que está vieja', () => {
    expect(tieneFormaDePedido(COPIA_DE_HACE_SEIS_MESES)).toBe(true);
  });

  it('pero ya no se parece a lo que envía el backend, y ESO no lo dice ningún test', () => {
    expect(COPIA_DE_HACE_SEIS_MESES.ln_items).toHaveLength(0);
    expect(SEED_DTOS[0].ln_items.length).toBeGreaterThan(0); // los pedidos de verdad tienen líneas
  });
});
