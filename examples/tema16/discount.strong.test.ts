// @vitest-environment node
// TEMA 16 · Los tests que matan a los supervivientes. Bordes exactos y valores exactos.
//   npm run mutate -- examples/tema16/discount.ts --tests examples/tema16/discount   → 100 %
import { volumeDiscount } from './discount';

it.each([
  [999.99, 'standard', 0],
  [1000, 'standard', 50],
  [4999.99, 'standard', 250],
  [5000, 'standard', 500],
  [1000, 'gold', 70],
  [5000, 'gold', 600],
  [999.99, 'gold', 0], // el extra gold solo se suma si ya había descuento
] as const)('%s € · %s → %s €', (amount, tier, expected) => {
  expect(volumeDiscount(amount, tier)).toBe(expected);
});
