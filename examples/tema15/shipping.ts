// TEMA 15 · El mismo cálculo, refactorizado en pasos pequeños (cada paso, con los tests de caracterización en verde):
//   1. Tipar la entrada (any → ShippingInput).                     4. Separar el CÁLCULO (número) del FORMATO (texto).
//   2. Extraer el peso a una función pura.                         5. Nombrar las constantes de negocio.
//   3. Extraer «es isla» a una función con nombre.                 6. Conservar la rareza del exprés: es comportamiento.
// Lo que NO se ha hecho: «arreglar» el exprés. Si es un bug, se decide aparte, con su test y su PR.
export type ShippingInput = { items: { kg: number; qty: number }[]; zip: string; total: number; express: boolean };

const BASE = 4.95;
const INCLUDED_KG = 5;
const PER_EXTRA_KG = 0.8;
const ISLAND_PREFIXES = ['07', '35', '38']; // Baleares, Las Palmas, Santa Cruz de Tenerife
const ISLAND_FACTOR = 2;
const FREE_FROM = 500;
const EXPRESS = 9.9;

export const weightOf = (items: ShippingInput['items']): number => items.reduce((sum, item) => sum + item.kg * item.qty, 0);
export const isIsland = (zip: string): boolean => ISLAND_PREFIXES.some((prefix) => zip.startsWith(prefix));

export function shippingCost({ items, zip, total, express }: ShippingInput): number {
  const weight = weightOf(items);
  const standard = (BASE + Math.max(0, weight - INCLUDED_KG) * PER_EXTRA_KG) * (isIsland(zip) ? ISLAND_FACTOR : 1);
  const base = total >= FREE_FROM ? 0 : standard;
  return base + (express ? EXPRESS : 0);
}

const EUR = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
export const formatShipping = (cost: number): string => `${EUR.format(Math.round(cost * 100) / 100)} €`;

/** Misma firma que la heredada: permite cambiar una por otra sin tocar a quien llama (rama por abstracción). */
export const calcShipping = (input: ShippingInput): string => formatShipping(shippingCost(input));
