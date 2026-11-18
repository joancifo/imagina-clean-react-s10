// @vitest-environment node
// TEST DE CONTRATO entre las DOS implementaciones de las mismas reglas: el dominio (navegador) y el BFF (Node).
// No comparten código: comparten los números de shared/policy.json. Este test comprueba que, además, deciden igual.
// Si alguien cambia una condición en un lado y no en el otro, falla aquí y no en producción.
import { denyReason, totalOf, type BffAction } from '../../server/bff.mjs';
import type { LegacyOrderJson } from '../../server/app.d.mts';
import { SEED_ORDERS } from '../../server/store.mjs';
import { checkApproval } from './domain/approval';
import { checkCancellation, type Actor } from './domain/cancellation';
import { calculateTotal, type Order } from './domain/order';
import { toOrder } from './infrastructure/order-mapper';
import type { OrderDto } from './infrastructure/order-dto';
import { createCancellationReason } from './domain/cancellation-reason';

const reason = createCancellationReason('Pedido duplicado en el ERP');
if (!reason.ok) throw new Error('motivo de prueba no válido');

const GRANDE = { ord_id: 'P-2001', cust_nm: 'Obra Mayor', cust_tier: 'standard', ord_st: 'pending', owner_id: 'u2', crt_ts: '2026-11-01T09:00:00Z', ln_items: [{ sku: 'G-70', qty: 20, unit_prc: 700 }] };
const DTOS = [...SEED_ORDERS, GRANDE] as unknown as OrderDto[];
const ACTORS: Actor[] = [{ id: 'u1', role: 'admin' }, { id: 'u2', role: 'manager' }, { id: 'u3', role: 'agent' }];

/** Traduce la decisión del dominio a «se permite o no». */
const domainAllows = (action: BffAction, order: Order, actor: Actor): boolean =>
  action === 'approve' ? checkApproval(order, actor).ok : action === 'cancel' ? checkCancellation(order, actor).ok : actor.role !== 'agent';

describe('el dominio y el BFF deciden lo mismo', () => {
  it('calculan el mismo total para cada pedido', () => {
    for (const dto of DTOS) {
      expect(totalOf(dto as unknown as LegacyOrderJson)).toBeCloseTo(calculateTotal(toOrder(dto)), 6);
    }
  });

  it.each(['approve', 'cancel'] as BffAction[])('permiten lo mismo al %s', (action) => {
    const diferencias = DTOS.flatMap((dto) =>
      ACTORS.map((actor) => {
        const bff = denyReason(action, dto as unknown as LegacyOrderJson, actor) === null;
        const dominio = domainAllows(action, toOrder(dto), actor);
        return bff === dominio ? null : `${action} · ${dto.ord_id} · ${actor.role}: BFF=${bff} dominio=${dominio}`;
      }),
    ).filter(Boolean);
    expect(diferencias).toEqual([]);
  });
});
