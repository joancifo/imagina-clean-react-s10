// TEMA 15 · Código HEREDADO de verdad: nadie sabe del todo qué hace, y funciona en producción.
// Calcula los portes de un pedido. Antes de tocarlo, se fija su comportamiento con tests de caracterización.
/* eslint-disable @typescript-eslint/no-explicit-any */
export function calcShipping(o: any): string {
  let w = 0;
  for (let i = 0; i < o.items.length; i++) w = w + o.items[i].kg * o.items[i].qty;
  let price = 4.95;
  if (w > 5) price = price + (w - 5) * 0.8;
  if (o.zip.startsWith('07') || o.zip.startsWith('35') || o.zip.startsWith('38')) price = price * 2; // islas
  if (o.total >= 500) price = 0;
  if (o.express) price = price + 9.9; // el exprés se cobra aunque el envío sea gratis (¿bug o regla? nadie lo sabe)
  return (Math.round(price * 100) / 100).toFixed(2).replace('.', ',') + ' €';
}
