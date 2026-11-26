// @vitest-environment node
// Sesión 10 · Tests unitarios de las reglas de devoluciones. Mismos números que la caracterización
// (src/pages/returns.characterization.test.tsx), pero sin pantalla, sin red y sin reloj: milisegundos.
import { canManageReturns, chargesRestocking, isWithinReturnWindow, needsAdminApproval, refundFor, remainingQuantity } from './return-rules';

describe('refundFor · importe a devolver', () => {
  it.each([
    // tier        motivo               uds  precio  importe   por qué
    ['standard', 'NO_LONGER_NEEDED', 1, 140, 148.4], //  169,40 con IVA − 21,00 de reposición
    ['standard', 'DEFECTIVE', 1, 140, 169.4], //         sin reposición
    ['standard', 'WRONG_ITEM', 1, 140, 148.4], //        RAREZA 1: también paga reposición
    ['silver', 'NO_LONGER_NEEDED', 2, 32.5, 64.97], //   74,72 con 5 % e IVA − 9,75 (RAREZA 2: sobre el precio sin descuento)
    ['gold', 'NO_LONGER_NEEDED', 1, 95, 103.46], //      10 % y nunca paga reposición
    ['gold', 'NO_LONGER_NEEDED', 5, 95, 517.28],
  ] as const)('%s · %s · %i × %d € → %d €', (tier, reason, quantity, unitPrice, expected) => {
    expect(refundFor({ tier, reason, quantity, unitPrice })).toBe(expected);
  });

  it('un nivel desconocido no tiene descuento (como hacía la pantalla)', () => {
    expect(refundFor({ tier: 'platinum', reason: 'DEFECTIVE', quantity: 1, unitPrice: 100 })).toBe(121);
  });
});

describe('chargesRestocking · gastos de reposición', () => {
  it.each([
    ['standard', 'NO_LONGER_NEEDED', true],
    ['standard', 'DEFECTIVE', false],
    ['standard', 'WRONG_ITEM', true],
    ['silver', 'NO_LONGER_NEEDED', true],
    ['gold', 'NO_LONGER_NEEDED', false],
    ['gold', 'WRONG_ITEM', false],
  ] as const)('%s · %s → %s', (tier, reason, expected) => {
    expect(chargesRestocking(tier, reason)).toBe(expected);
  });
});

describe('isWithinReturnWindow · 30 × 24 horas desde la entrega', () => {
  const delivered = '2026-11-12T10:00:00Z';
  it.each([
    ['2026-11-30T17:00:00Z', true], //  el día de clase: 18 días
    ['2026-12-12T09:59:00Z', true], //  RAREZA 3: un minuto antes de las 720 horas
    ['2026-12-12T10:00:00Z', true], //  justo 720 horas: todavía dentro (la pantalla usaba «> 30»)
    ['2026-12-12T10:01:00Z', false],
  ])('ahora = %s → %s', (now, expected) => {
    expect(isWithinReturnWindow(delivered, new Date(now))).toBe(expected);
  });
});

describe('remainingQuantity · lo que queda por devolver', () => {
  it('pedidas menos ya devueltas', () => expect(remainingQuantity(3, [1])).toBe(2));
  it('sin devoluciones previas, todas', () => expect(remainingQuantity(3, [])).toBe(3));
  it('varias devoluciones previas se suman', () => expect(remainingQuantity(10, [2, 3])).toBe(5));
  it('todo devuelto: cero', () => expect(remainingQuantity(3, [1, 2])).toBe(0));
});

describe('quién gestiona devoluciones', () => {
  it.each([
    ['manager', 500, false],
    ['manager', 500.01, true],
    ['admin', 5000, false],
  ] as const)('%s con %d € → necesita admin: %s', (role, amount, expected) => {
    expect(needsAdminApproval(role, amount)).toBe(expected);
  });

  it.each([
    ['admin', true],
    ['manager', true],
    ['agent', false],
  ] as const)('%s → puede gestionar: %s', (role, expected) => expect(canManageReturns(role)).toBe(expected));
});
