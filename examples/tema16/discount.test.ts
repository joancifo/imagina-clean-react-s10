// @vitest-environment node
// TEMA 16 · Tests DÉBILES con un 100 % de cobertura de líneas.
//   npm run coverage                                                          → discount.ts al 100 %
//   npm run mutate -- examples/tema16/discount.ts --tests examples/tema16/discount.test   → sobreviven mutantes
// ¿Por qué? No prueban los bordes (999,99 / 1000 / 5000) y la aserción del gold solo mira que «hay descuento».
import { volumeDiscount } from './discount';

it('sin volumen no hay descuento', () => {
  expect(volumeDiscount(100, 'standard')).toBe(0);
});

it('con mucho volumen hay descuento', () => {
  expect(volumeDiscount(8000, 'standard')).toBe(800);
  expect(volumeDiscount(2000, 'silver')).toBe(100);
});

it('un gold tiene descuento', () => {
  expect(volumeDiscount(3000, 'gold')).toBeGreaterThan(0);
});
