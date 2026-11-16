// PRESENTACIÓN · Hook de DATOS: carga la lista con el caso de uso y expone el estado de la carga.
// No filtra, no ordena, no formatea (eso es el view model) y no sabe que existe HTTP (eso es el adapter).
// Ejercicio S5 · Parte C · paso 1. La especificación es useOrdersList.test.tsx.
// Piezas ya escritas: ordersListReducer e INITIAL_ORDERS_LIST (./orders-list-state) · useOrdersModule().listOrders (./OrdersProvider).
import type { OrdersListState } from './orders-list-state';

export function useOrdersList(): { state: OrdersListState; reload: () => void } {
  throw new Error('Por implementar (ejercicio S5 · Parte C)');
}
