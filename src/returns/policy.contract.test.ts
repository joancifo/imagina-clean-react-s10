// @vitest-environment node
// Sesión 10 · Paso 3 · TEST DE CONTRATO: el dominio (navegador) y el BFF (Node) deciden lo mismo sobre devoluciones.
// No comparten código: comparten los números de shared/policy.json. Mismo patrón que src/orders/policy.contract.test.ts.
// Si alguien responde a una pregunta de Producto en un lado y no en el otro, falla aquí y no en producción.
import { refundOf, returnDenial, withinWindow } from '../../server/returns.mjs';
import type { LegacyOrderJson } from '../../server/app.d.mts';
import { canManageReturns, isWithinReturnWindow, needsAdminApproval, refundFor, remainingQuantity, RETURN_REASONS, type ReturnReason } from './index';

const TIERS = ['gold', 'silver', 'standard', 'desconocido'];
const PRICES = [0.99, 32.5, 95, 140, 999.95];
const QUANTITIES = [1, 2, 5, 13];

describe('el dominio y el BFF deciden lo mismo sobre devoluciones', () => {
  it('calculan el mismo importe para cada nivel, motivo, precio y cantidad', () => {
    const differences = TIERS.flatMap((tier) =>
      RETURN_REASONS.flatMap((reason) =>
        PRICES.flatMap((unitPrice) =>
          QUANTITIES.map((quantity) => {
            const input = { tier, reason, unitPrice, quantity };
            const [client, server] = [refundFor(input), refundOf(input)];
            return client === server ? null : `${JSON.stringify(input)}: dominio=${client} BFF=${server}`;
          }),
        ),
      ),
    ).filter(Boolean);
    expect(differences).toEqual([]);
  });

  it.each(['2026-11-30T17:00:00Z', '2026-12-12T09:59:00Z', '2026-12-12T10:00:00Z', '2026-12-12T10:01:00Z', '2027-01-01T00:00:00Z'])(
    'aplican el mismo plazo el %s',
    (now) => expect(withinWindow('2026-11-12T10:00:00Z', new Date(now))).toBe(isWithinReturnWindow('2026-11-12T10:00:00Z', new Date(now))),
  );

  it('permiten lo mismo a cada rol, cantidad y motivo (pedido entregado y en plazo)', () => {
    const order = { ord_id: 'P-2001', cust_nm: 'Construcciones Vega', cust_tier: 'gold', ord_st: 'shipped', owner_id: 'u2', crt_ts: '2026-11-02T08:00:00Z', ln_items: [{ sku: 'D-40', qty: 10, unit_prc: 95 }] } as unknown as LegacyOrderJson;
    const shipment = { trk_no: 'TRK-90001', sts_cd: 'DLV', dlv_ts: '2026-11-20T10:00:00Z' };
    const previous = [{ sku: 'D-40', qty: 2 }];
    const differences = ['admin', 'manager', 'agent'].flatMap((role) =>
      RETURN_REASONS.flatMap((reason) =>
        [1, 4, 5, 8, 9].map((quantity) => {
          const server = returnDenial({ order, shipment, previous, actor: { id: 'x', role }, sku: 'D-40', quantity, reason, now: new Date('2026-11-30T17:00:00Z') }) === null;
          const amount = refundFor({ tier: 'gold', reason: reason as ReturnReason, unitPrice: 95, quantity });
          const client = canManageReturns(role) && quantity <= remainingQuantity(10, [2]) && !needsAdminApproval(role, amount);
          return client === server ? null : `${role} · ${reason} · ${quantity} uds.: dominio=${client} BFF=${server}`;
        }),
      ),
    ).filter(Boolean);
    expect(differences).toEqual([]);
  });
});
