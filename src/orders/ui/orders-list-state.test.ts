// @vitest-environment node
import type { Order } from '../domain/order';
import { INITIAL_ORDERS_LIST, ordersListReducer, type OrdersListAction, type OrdersListState } from './orders-list-state';

const ORDERS = [{ id: 'P-1' } as Order];
const run = (actions: OrdersListAction[], from: OrdersListState = INITIAL_ORDERS_LIST) => actions.reduce(ordersListReducer, from);

it('carga correcta: loading → ready', () => {
  expect(run([{ type: 'loaded', orders: ORDERS }])).toEqual({ status: 'ready', orders: ORDERS, refreshing: false });
});

it('carga fallida: loading → error → (reload) loading → ready', () => {
  expect(run([{ type: 'failed' }])).toEqual({ status: 'error' });
  expect(run([{ type: 'failed' }, { type: 'reload' }])).toEqual({ status: 'loading' });
  expect(run([{ type: 'failed' }, { type: 'reload' }, { type: 'loaded', orders: ORDERS }]).status).toBe('ready');
});

it('refresco: los datos siguen en pantalla mientras se vuelven a pedir', () => {
  expect(run([{ type: 'loaded', orders: ORDERS }, { type: 'reload' }])).toEqual({ status: 'ready', orders: ORDERS, refreshing: true });
});

it('un refresco fallido conserva los datos anteriores', () => {
  expect(run([{ type: 'loaded', orders: ORDERS }, { type: 'reload' }, { type: 'failed' }])).toEqual({ status: 'ready', orders: ORDERS, refreshing: false });
});
