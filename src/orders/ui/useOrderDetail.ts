// PRESENTACIÓN · Hook de DATOS del detalle (Sesión 7). Cuatro estados y ninguna respuesta tardía.
import type { Order } from '../domain/order';

export type OrderDetailState = { status: 'loading' } | { status: 'not-found' } | { status: 'error' } | { status: 'ready'; order: Order };

export function useOrderDetail(_orderId: string): OrderDetailState {
  throw new Error('Por implementar (Ejercicio S7 · Parte B)');
}
