// PRESENTACIÓN · Hook de INFRAESTRUCTURA de UI: conecta los criterios con la URL (react-router).
// No guarda estado propio: lee la URL y escribe en la URL. Toda la lógica está en orders-criteria.ts (puro).
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseCriteria, writeCriteria, type OrdersCriteria } from './orders-criteria';

export function useOrdersCriteria(): [OrdersCriteria, (patch: Partial<OrdersCriteria>) => void] {
  const [params, setParams] = useSearchParams();
  const criteria = useMemo(() => parseCriteria(params), [params]);

  const update = useCallback(
    (patch: Partial<OrdersCriteria>) => {
      // replace: escribir en el buscador no crea una entrada de historial por cada tecla.
      setParams((current) => writeCriteria({ ...parseCriteria(current), ...patch }, current), { replace: true });
    },
    [setParams],
  );

  return [criteria, update];
}
