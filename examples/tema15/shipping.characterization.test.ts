// @vitest-environment node
// TEMA 15 · Tests de CARACTERIZACIÓN («golden master»): no dicen lo que DEBERÍA pasar, fijan lo que PASA.
// Cómo se escriben: se elige un abanico de entradas que recorra cada rama (y sus bordes), se ejecuta el código
// heredado y se copia su salida. Después, la MISMA tabla se pasa contra la versión nueva.
import { calcShipping as legacy } from './legacy-shipping';
import { calcShipping as refactored } from './shipping';

const item = (kg: number, qty = 1) => ({ kg, qty });
const CASES = [
  { name: 'ligero, península', input: { items: [item(1, 2)], zip: '28001', total: 40, express: false }, expected: '4,95 €' },
  { name: 'justo 5 kg (borde)', input: { items: [item(5)], zip: '28001', total: 40, express: false }, expected: '4,95 €' },
  { name: '7,5 kg: 2,5 kg de más', input: { items: [item(2.5, 3)], zip: '08001', total: 40, express: false }, expected: '6,95 €' },
  { name: 'Baleares, dobla', input: { items: [item(1)], zip: '07001', total: 40, express: false }, expected: '9,90 €' },
  { name: 'Canarias con sobrepeso', input: { items: [item(10)], zip: '38001', total: 40, express: false }, expected: '17,90 €' },
  { name: '499,99 € (borde): paga', input: { items: [item(1)], zip: '28001', total: 499.99, express: false }, expected: '4,95 €' },
  { name: '500 € (borde): gratis', input: { items: [item(1)], zip: '28001', total: 500, express: false }, expected: '0,00 €' },
  { name: 'exprés', input: { items: [item(1)], zip: '28001', total: 40, express: true }, expected: '14,85 €' },
  { name: 'gratis + exprés: cobra el exprés (rareza conservada)', input: { items: [item(1)], zip: '07001', total: 900, express: true }, expected: '9,90 €' },
  { name: 'pedido de 1234 kg (sin separador de miles)', input: { items: [item(1234)], zip: '28001', total: 40, express: false }, expected: '988,15 €' },
];

describe.each([
  ['heredada', legacy],
  ['refactorizada', refactored],
] as const)('portes · %s', (_name, calcShipping) => {
  it.each(CASES)('$name → $expected', ({ input, expected }) => {
    expect(calcShipping(input)).toBe(expected);
  });
});
