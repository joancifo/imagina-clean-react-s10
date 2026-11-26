// @vitest-environment node
// Sesión 10 · Paso 4 · La frontera: lo que no tiene la forma esperada no entra en el dominio.
import { parseReturnContext } from './return-context-dto';

const VALID = {
  ord_id: 'P-1004', cust_nm: 'Clínica Dental Mar', cust_tier: 'standard', ord_st: 'shipped',
  ln_items: [{ sku: 'E-50', qty: 3, unit_prc: 140, returned_qty: 1 }],
  delivery: { trk_no: 'TRK-88412', dlv_ts: '2026-11-12T10:00:00Z' },
};

describe('parseReturnContext', () => {
  it('traduce los nombres del backend a los del dominio', () => {
    expect(parseReturnContext(VALID)).toEqual({
      ok: true,
      value: { orderId: 'P-1004', customerName: 'Clínica Dental Mar', tier: 'standard', lines: [{ sku: 'E-50', ordered: 3, unitPrice: 140, alreadyReturned: 1 }], delivery: { trackingNumber: 'TRK-88412', deliveredAt: '2026-11-12T10:00:00Z' } },
    });
  });

  it('delivery: null es «no entregado», un dato válido', () => {
    expect(parseReturnContext({ ...VALID, delivery: null })).toMatchObject({ ok: true, value: { delivery: null } });
  });

  it('un campo nuevo del backend no entra solo (lista blanca)', () => {
    const parsed = parseReturnContext({ ...VALID, internal_margin: 0.42 });
    expect(parsed.ok && Object.keys(parsed.value)).toEqual(['orderId', 'customerName', 'tier', 'lines', 'delivery']);
  });

  it.each([
    ['sin cuerpo', null, 'cuerpo'],
    ['una lista en vez de un objeto', [], 'cuerpo'],
    ['cantidad negativa', { ...VALID, ln_items: [{ sku: 'E-50', qty: -1, unit_prc: 140, returned_qty: 0 }] }, 'ln_items[]'],
    ['precio en texto', { ...VALID, ln_items: [{ sku: 'E-50', qty: 3, unit_prc: '140', returned_qty: 0 }] }, 'ln_items[]'],
    ['fecha de entrega que no es una fecha', { ...VALID, delivery: { trk_no: 'TRK-1', dlv_ts: 'ayer' } }, 'delivery'],
    ['falta delivery (undefined no es null)', { ...VALID, delivery: undefined }, 'delivery'],
  ])('%s → error en %s', (_caso, raw, field) => {
    expect(parseReturnContext(raw)).toEqual({ ok: false, error: field });
  });
});
