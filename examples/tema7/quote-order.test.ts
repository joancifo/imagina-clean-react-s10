// @vitest-environment node
import { quoteOrder } from './quote-order';

it('calcula la vista previa con descuento e IVA, sin await', () => {
  expect(quoteOrder({ customerTier: 'silver', lines: [{ sku: 'A-10', quantity: 10, unitPrice: 32.5 }] })).toEqual({ ok: true, value: { lines: 1, total: 373.59 } });
});

it('devuelve errores previsibles como valores', () => {
  expect(quoteOrder({ customerTier: 'gold', lines: [] })).toEqual({ ok: false, error: 'no-lines' });
  expect(quoteOrder({ customerTier: 'gold', lines: [{ sku: 'A', quantity: 0.5, unitPrice: 1 }] })).toEqual({ ok: false, error: 'invalid-quantity' });
});
