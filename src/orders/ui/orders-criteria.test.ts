// @vitest-environment node
// Ejercicio S5 · Parte B · Especificación de los criterios de la lista como estado de URL (módulo puro).
import { DEFAULT_CRITERIA, parseCriteria, writeCriteria, type OrdersCriteria } from './orders-criteria';

const parse = (search: string) => parseCriteria(new URLSearchParams(search));

describe('Parte B · criterios en la URL (módulo puro)', () => {
  describe('parseCriteria', () => {
    it('sin parámetros devuelve los criterios por defecto', () => {
      expect(parse('')).toEqual({ text: '', status: 'all', onlyMine: false, sort: 'date' });
    });

    it('lee un enlace compartido', () => {
      expect(parse('q=hotel&status=pending&mine=1&sort=total')).toEqual({ text: 'hotel', status: 'pending', onlyMine: true, sort: 'total' });
    });

    it('un valor desconocido no rompe la pantalla: vuelve al valor por defecto', () => {
      expect(parse('status=borrado&sort=precio&mine=si')).toEqual(DEFAULT_CRITERIA);
    });

    it('conserva el texto tal y como se escribió (el campo de búsqueda se pinta desde la URL)', () => {
      expect(parse('q=hotel+').text).toBe('hotel ');
    });
  });

  describe('writeCriteria', () => {
    it('no escribe los valores por defecto: la URL limpia es la lista sin filtros', () => {
      expect(writeCriteria(DEFAULT_CRITERIA).toString()).toBe('');
    });

    it('escribe solo lo que se aparta del valor por defecto', () => {
      expect(writeCriteria({ ...DEFAULT_CRITERIA, status: 'pending', onlyMine: true }).toString()).toBe('status=pending&mine=1');
    });

    it('conserva los parámetros que no son suyos', () => {
      const next = writeCriteria({ ...DEFAULT_CRITERIA, text: 'vega' }, new URLSearchParams('debug=1&status=pending'));
      expect(Object.fromEntries(next)).toEqual({ debug: '1', q: 'vega' });
    });

    it('no modifica los parámetros recibidos', () => {
      const base = new URLSearchParams('status=pending');
      writeCriteria(DEFAULT_CRITERIA, base);
      expect(base.toString()).toBe('status=pending');
    });

    it('ida y vuelta: parse(write(c)) devuelve c para todas las combinaciones', () => {
      const all: OrdersCriteria[] = [];
      for (const status of ['all', 'pending', 'approved', 'shipped', 'cancelled'] as const)
        for (const sort of ['date', 'total', 'customer'] as const)
          for (const onlyMine of [false, true])
            for (const text of ['', 'Hotel Brisa', 'a&b=c']) all.push({ text, status, onlyMine, sort });
      for (const criteria of all) expect(parseCriteria(writeCriteria(criteria))).toEqual(criteria);
    });
  });
});
