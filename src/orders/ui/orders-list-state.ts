// PRESENTACIÓN · Estado de la carga de la lista como unión discriminada + reducer (máquina de estados pequeña).
// Los estados imposibles no se pueden representar: no existe «cargando Y con error» ni «listo sin pedidos cargados».
// Módulo puro: el hook useOrdersList lo conecta con React y con el caso de uso.
import type { Order } from '../domain/order';

export type OrdersListState =
  | { status: 'loading' }
  | { status: 'error' }
  /** refreshing: hay datos en pantalla y se están volviendo a pedir (no se vuelve a «Cargando…»). */
  | { status: 'ready'; orders: Order[]; refreshing: boolean };

export type OrdersListAction = { type: 'reload' } | { type: 'loaded'; orders: Order[] } | { type: 'failed' };

export const INITIAL_ORDERS_LIST: OrdersListState = { status: 'loading' };

export function ordersListReducer(state: OrdersListState, action: OrdersListAction): OrdersListState {
  switch (action.type) {
    case 'reload':
      return state.status === 'ready' ? { ...state, refreshing: true } : { status: 'loading' };
    case 'loaded':
      return { status: 'ready', orders: action.orders, refreshing: false };
    case 'failed':
      // Si ya había datos, se conservan: un refresco fallido no vacía la pantalla.
      return state.status === 'ready' ? { ...state, refreshing: false } : { status: 'error' };
  }
}
