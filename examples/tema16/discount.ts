// TEMA 16 · Una regla pequeña para medir la CALIDAD de sus tests con mutation testing.
// Descuento por volumen: 5 % desde 1000 €, 10 % desde 5000 €; los clientes gold suman un 2 % extra.
export function volumeDiscount(amount: number, tier: 'gold' | 'silver' | 'standard'): number {
  let rate = 0;
  if (amount >= 5000) rate = 0.1;
  else if (amount >= 1000) rate = 0.05;
  if (tier === 'gold' && rate > 0) rate = rate + 0.02;
  return Math.round(amount * rate * 100) / 100;
}
