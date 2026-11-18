// PRESENTACIÓN · Hook de DATOS: carga la lista con el caso de uso y expone el estado de la carga.
// No filtra, no ordena, no formatea (eso es el view model) y no sabe que existe HTTP (eso es el adapter).
import { useCallback, useEffect, useReducer, useState } from 'react';
import { INITIAL_ORDERS_LIST, ordersListReducer, type OrdersListState } from './orders-list-state';
import { useOrdersModule } from './OrdersProvider';

export function useOrdersList(): { state: OrdersListState; reload: () => void } {
  const { listOrders } = useOrdersModule();
  const [state, dispatch] = useReducer(ordersListReducer, INITIAL_ORDERS_LIST);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true; // la limpieza desactiva esta petición: su respuesta, si llega tarde, se ignora
    listOrders().then(
      (orders) => active && dispatch({ type: 'loaded', orders }),
      () => active && dispatch({ type: 'failed' }),
    );
    return () => {
      active = false;
    };
  }, [listOrders, attempt]);

  const reload = useCallback(() => {
    dispatch({ type: 'reload' });
    setAttempt((current) => current + 1);
  }, []);

  return { state, reload };
}
