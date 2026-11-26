// @vitest-environment node
// Repaso · Adapters · Los cuatro niveles, ejecutables: npm run repaso:adapter
// Lee cada describe de arriba abajo: cuenta la historia de por qué existe un adapter.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fakeBackend } from './backend';
import * as nivel1 from './01-sin-adapter';
import * as nivel2 from './02-mapper';
import { composeForProduction, composeForTests } from './03-puerto';
import { createProductionOrderReader, parseOrder, ReaderError } from './04-frontera';

const source = (file: string) => readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
const mentions = (file: string, word: string) => (source(file).match(new RegExp(`\\.${word}\\b`, 'g')) ?? []).length;

describe('NIVEL 1 · sin adapter: los nombres del backend están por todas partes', () => {
  it('con el backend de hoy, funciona', async () => {
    expect(await nivel1.orderHeader(fakeBackend(), 'P-1004')).toBe('P-1004 · Clínica Dental Mar · Enviado');
    expect(await nivel1.canReturn(fakeBackend(), 'P-1004')).toBe(true);
  });

  it('el backend renombra ord_st → order_status: DOS pantallas se rompen, y ninguna da error', async () => {
    const v2 = fakeBackend({ version: 2 });
    expect(await nivel1.orderHeader(v2, 'P-1004')).toBe('P-1004 · Clínica Dental Mar · Pendiente'); // miente
    expect(await nivel1.canReturn(v2, 'P-1004')).toBe(false); // y desaparece el botón
  });

  it('o.ord_st aparece en varios sitios del archivo: cada uno es un sitio que tocar', () => {
    expect(mentions('./01-sin-adapter.ts', 'ord_st')).toBe(3);
  });
});

describe('NIVEL 2 · un mapper: el backend solo se conoce en UNA función', () => {
  it('las pantallas dan lo mismo que antes', async () => {
    expect(await nivel2.orderHeader(fakeBackend(), 'P-1004')).toBe('P-1004 · Clínica Dental Mar · Enviado');
    expect(await nivel2.orderTotal(fakeBackend(), 'P-1004')).toBeCloseTo(508.2);
  });

  it('ord_st aparece una sola vez: en toOrder. El cambio del backend es UNA línea', () => {
    expect(mentions('./02-mapper.ts', 'ord_st')).toBe(1);
  });
});

describe('NIVEL 3 · puerto y adapters: el mismo caso de uso, con HTTP o en memoria', () => {
  it('en producción, con el adapter HTTP', async () => {
    expect(await composeForProduction(fakeBackend())('P-1004')).toBe('Se puede devolver P-1004');
  });

  it('en tests, con el adapter en memoria: sin red, sin backend, en microsegundos', async () => {
    const describeReturn = composeForTests([{ id: 'P-1', customerName: 'Prueba', tier: 'gold', status: 'pending', lines: [] }]);
    expect(await describeReturn('P-1')).toBe('P-1 todavía no se ha enviado');
    expect(await describeReturn('P-9')).toBe('No existe el pedido');
  });
});

describe('NIVEL 4 · la frontera: parsear, tolerar y traducir errores', () => {
  it('lector tolerante: el backend v2 (order_status) y un campo nuevo NO rompen nada', async () => {
    const reader = createProductionOrderReader(fakeBackend({ version: 2, extra: { internal_margin: 0.42 } }));
    const order = await reader.find('P-1004');
    expect(order?.status).toBe('shipped');
    expect(Object.keys(order ?? {})).toEqual(['id', 'customerName', 'tier', 'status', 'lines']); // el campo nuevo no entra
  });

  it('lista blanca: un estado que no existe no entra en el dominio', () => {
    expect(parseOrder({ ord_id: 'P-1', cust_nm: 'X', ord_st: 'perdido', ln_items: [] })).toBeNull();
  });

  it.each([
    [409, 'conflict'],
    [500, 'unavailable'],
  ] as const)('HTTP %i → %s: un fallo del puerto, no un código HTTP', async (status, failure) => {
    const reader = createProductionOrderReader(fakeBackend({ status }));
    await expect(reader.find('P-1004')).rejects.toEqual(new ReaderError(failure));
  });

  it('sin red → unavailable (y no un TypeError que nadie espera)', async () => {
    const reader = createProductionOrderReader((() => Promise.reject(new TypeError('Failed to fetch'))) as typeof fetch);
    await expect(reader.find('P-1004')).rejects.toMatchObject({ failure: 'unavailable' });
  });
});
