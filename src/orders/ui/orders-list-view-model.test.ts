// @vitest-environment node
// Ejercicio S5 · Parte A · Especificación del view model de la lista. Sin React y sin render: datos de entrada, datos de salida.
import type { Actor } from '../domain/cancellation';
import type { Order } from '../domain/order';
import { formatCurrency } from './formatters';
import { DEFAULT_CRITERIA, type OrdersCriteria } from './orders-criteria';
import { buildOrdersListViewModel } from './orders-list-view-model';

// Mismos pedidos que server/app.mjs, más un cliente con tilde. Totales con descuento e IVA entre paréntesis.
type Row = [id: string, customerName: string, customerTier: Order['customerTier'], status: Order['status'], ownerId: string, day: string, quantity: number, unitPrice: number];
const order = ([id, customerName, customerTier, status, ownerId, day, quantity, unitPrice]: Row): Order =>
  ({ id, customerName, customerTier, status, ownerId, createdAt: `2026-10-${day}T09:00:00Z`, lines: [{ sku: 'A-10', quantity, unitPrice }] });

const ORDERS: readonly Order[] = Object.freeze([
  order(['P-1003', 'Construcciones Vega', 'gold', 'pending', 'u3', '05', 60, 95]), //    6207,30 €
  order(['P-1001', 'Talleres Norte', 'gold', 'pending', 'u2', '02', 1, 2140]), //        2330,46 €
  order(['P-1006', 'Logística Ebro', 'standard', 'cancelled', 'u3', '09', 1, 900]), //   1089,00 €
  order(['P-1002', 'Ferretería Sol', 'silver', 'approved', 'u2', '03', 12, 18]), //       248,29 €
  order(['P-1007', 'Árboles Ruiz', 'standard', 'pending', 'u2', '10', 1, 12000]), //    14520,00 €
  order(['P-1005', 'Hotel Brisa', 'silver', 'pending', 'u2', '08', 10, 32.5]), //         373,59 €
]);

const admin: Actor = { id: 'u1', role: 'admin' };
const manager: Actor = { id: 'u2', role: 'manager' };
const agent: Actor = { id: 'u3', role: 'agent' };

const build = (criteria: Partial<OrdersCriteria> = {}, actor: Actor | null = manager, orders = ORDERS) =>
  buildOrdersListViewModel(orders, { ...DEFAULT_CRITERIA, ...criteria }, actor);
const ids = (criteria: Partial<OrdersCriteria> = {}, actor: Actor | null = manager) => build(criteria, actor).rows.map((row) => row.id);

describe('Parte A · view model de la lista', () => {
  describe('filtrar', () => {
    it('por texto: cliente o número de pedido, sin distinguir mayúsculas ni espacios en los extremos', () => {
      expect(ids({ text: '  VEGA ' })).toEqual(['P-1003']);
      expect(ids({ text: 'p-1005' })).toEqual(['P-1005']);
    });

    it('por estado', () => {
      expect(ids({ status: 'approved' })).toEqual(['P-1002']);
    });

    it('«solo míos» usa el actor', () => {
      expect(ids({ onlyMine: true }, manager)).toEqual(['P-1001', 'P-1002', 'P-1005', 'P-1007']);
    });

    // Sesión 8 · CAMBIO DE COMPORTAMIENTO declarado. Antes: el criterio se aplicaba para todo el mundo y a un
    // agente le dejaba la lista vacía, porque el BFF no le envía owner_id y la comparación nunca era cierta.
    // Ahora: un criterio que no se puede aplicar se ignora, y la pantalla no lo ofrece (canFilterByOwner).
    it('«solo míos» se ignora para quien no recibe el responsable, en vez de vaciar la lista', () => {
      expect(ids({ onlyMine: true }, agent)).toEqual(ids({}, agent));
      expect(build({ onlyMine: true }, agent).canFilterByOwner).toBe(false);
      expect(build({ onlyMine: true }, manager).canFilterByOwner).toBe(true);
    });

    it('los criterios se combinan', () => {
      expect(ids({ status: 'pending', onlyMine: true, text: 'a' })).toEqual(['P-1001', 'P-1005']);
    });
  });

  describe('ordenar', () => {
    it('por fecha (por defecto), de más antiguo a más reciente', () => {
      expect(ids()).toEqual(['P-1001', 'P-1002', 'P-1003', 'P-1005', 'P-1006', 'P-1007']);
    });

    it('por importe: como número, no como texto', () => {
      expect(ids({ sort: 'total' })).toEqual(['P-1002', 'P-1005', 'P-1006', 'P-1001', 'P-1003', 'P-1007']);
    });

    it('por cliente: orden alfabético en español («Árboles» va antes que «Construcciones»)', () => {
      expect(ids({ sort: 'customer' })).toEqual(['P-1007', 'P-1003', 'P-1002', 'P-1005', 'P-1006', 'P-1001']);
    });

    it('no modifica la lista recibida (ORDERS está congelada: mutarla lanza TypeError)', () => {
      expect(() => build({ sort: 'total' })).not.toThrow();
      expect(ORDERS[0].id).toBe('P-1003');
    });
  });

  describe('filas listas para pintar', () => {
    it('manager: fecha, estado, importe y responsable ya formateados', () => {
      expect(build({ text: 'P-1005' }).rows[0]).toEqual({
        id: 'P-1005', customer: 'Hotel Brisa', date: '08/10/2026', owner: 'Yo', statusLabel: 'Pendiente', tone: 'normal',
        total: formatCurrency(373.585), canApprove: true, canCancel: true,
      });
    });

    it('el responsable que no es el actor se muestra con su identificador', () => {
      expect(build({ text: 'P-1003' }).rows[0].owner).toBe('u3');
    });

    it('tono: urgente si el dominio dice isUrgent; atenuado si está cancelado', () => {
      const tones = Object.fromEntries(build().rows.map((row) => [row.id, row.tone]));
      expect(tones).toEqual({ 'P-1001': 'normal', 'P-1002': 'normal', 'P-1003': 'urgent', 'P-1005': 'normal', 'P-1006': 'muted', 'P-1007': 'urgent' });
    });

    it('las acciones salen de las reglas del dominio, no de condiciones nuevas', () => {
      const actions = (actor: Actor) => Object.fromEntries(build({}, actor).rows.map((row) => [row.id, `${row.canApprove ? 'A' : '-'}${row.canCancel ? 'C' : '-'}`]));
      //                       P-1001      P-1002      P-1003 (6207 €) P-1005      P-1006      P-1007 (14520 €)
      expect(actions(admin)).toEqual({ 'P-1001': 'AC', 'P-1002': '-C', 'P-1003': 'AC', 'P-1005': 'AC', 'P-1006': '--', 'P-1007': 'AC' });
      expect(actions(manager)).toEqual({ 'P-1001': 'AC', 'P-1002': '--', 'P-1003': 'A-', 'P-1005': 'AC', 'P-1006': '--', 'P-1007': '--' });
      expect(actions(agent)).toEqual({ 'P-1001': '--', 'P-1002': '--', 'P-1003': '--', 'P-1005': '--', 'P-1006': '--', 'P-1007': '--' });
    });

    it('un agente no recibe importes ni responsables: el dato no llega a la pantalla', () => {
      const viewModel = build({}, agent);
      expect(viewModel.showAmounts).toBe(false);
      expect(viewModel.rows.every((row) => row.total === null && row.owner === null)).toBe(true);
      expect(JSON.stringify(viewModel)).not.toMatch(/€/);
    });
  });

  describe('resumen', () => {
    it('cuenta los pendientes de lo que se ve (después de filtrar)', () => {
      expect(build({ onlyMine: true }).summary).toBe(`3 pendientes por ${formatCurrency(2330.46 + 14520 + 373.585)} · 1 urgentes`);
      expect(build({ status: 'approved' }).summary).toBe(`0 pendientes por ${formatCurrency(0)}`);
    });

    it('el aviso de riesgo de crédito (regla del dominio) solo lo ve un administrador', () => {
      expect(build({}, admin).summary).toBe(`4 pendientes por ${formatCurrency(23431.345)} · 2 urgentes · Revisar riesgo de crédito`);
      expect(build({}, manager).summary).toBe(`4 pendientes por ${formatCurrency(23431.345)} · 2 urgentes`);
      expect(build({ text: 'hotel' }, admin).summary).not.toMatch(/riesgo/);
    });

    it('un agente ve cuántos pendientes hay, sin importes', () => {
      expect(build({}, agent).summary).toBe('4 pendientes · 2 urgentes');
    });
  });

  describe('lista vacía', () => {
    it('con filas no hay mensaje', () => {
      expect(build().emptyMessage).toBeNull();
    });

    it('sin pedidos y sin filtros', () => {
      expect(build({}, manager, []).emptyMessage).toBe('Todavía no hay pedidos');
    });

    it('sin resultados por culpa de los filtros (un texto de solo espacios no es un filtro)', () => {
      expect(build({ text: 'zzz' }).emptyMessage).toBe('Sin resultados para estos filtros');
      expect(build({ text: '   ' }, manager, []).emptyMessage).toBe('Todavía no hay pedidos');
    });
  });
});
