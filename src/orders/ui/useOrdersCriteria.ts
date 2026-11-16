// PRESENTACIÓN · Hook de INFRAESTRUCTURA de UI: conecta los criterios con la URL (react-router).
// No guarda estado propio: lee la URL y escribe en la URL. Toda la lógica está en orders-criteria.ts (puro).
// Ejercicio S5 · Parte B. La especificación es useOrdersCriteria.test.tsx.
import type { OrdersCriteria } from './orders-criteria';

export function useOrdersCriteria(): [OrdersCriteria, (patch: Partial<OrdersCriteria>) => void] {
  throw new Error('Por implementar (ejercicio S5 · Parte B)');
}
